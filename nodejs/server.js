const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const http = require('http');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const Redis = require('ioredis');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const apiRoutes = require('./src/routes/api');
const datingRoutes = require('./src/routes/datingRoutes');

// Load background daily notification scheduler
require('./src/services/notification.service');

const app = express();
const PORT = process.env.PORT || 8000;

// Create HTTP server
const server = http.createServer(app);

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const pubClient = new Redis(redisUrl);
const subClient = pubClient.duplicate();

pubClient.on('error', (err) => console.error('Socket.io Redis PubClient Error:', err.message));
subClient.on('error', (err) => console.error('Socket.io Redis SubClient Error:', err.message));

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow all origins (web browsers, deployed domains, mobile apps, TWAs, etc.)
      callback(null, true);
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

io.adapter(createAdapter(pubClient, subClient));


app.set('io', io);

// Mount Socket.io handler
const datingPrisma = require('./src/utils/datingPrisma');
const { sendPushNotification } = require('./src/utils/pushNotifier');
const cacheService = require('./src/services/cache.service');
const redis = require('./src/lib/redis');

const workerId = process.env.NODE_APP_INSTANCE || 'standalone';
console.log(`[Socket.io] Initializing worker ${workerId}`);

const cleanupWorkerSockets = async () => {
  try {
    const workerSocketsKey = `worker:sockets:${workerId}`;
    const entries = await redis.smembers(workerSocketsKey);
    console.log(`[Socket.io] Cleaning up ${entries.length} stale sockets for worker ${workerId}`);
    
    for (const entry of entries) {
      const [userIdStr, socketId] = entry.split(':');
      const socketSetKey = `user:sockets:${userIdStr}`;
      
      await redis.srem(socketSetKey, socketId);
      const activeCount = await redis.scard(socketSetKey);
      if (activeCount === 0) {
        await redis.srem('online_users', userIdStr);
        await redis.del(socketSetKey);
        io.emit('userStatus', { userId: userIdStr, online: false });
      }
    }
    await redis.del(workerSocketsKey);
  } catch (err) {
    console.error(`[Socket.io] Error during worker socket cleanup:`, err);
  }
};

// Run stale socket cleanup and DB sequence sync on worker startup
cleanupWorkerSockets();
const { syncAllSequences } = require('./src/utils/syncSequences');
if (workerId === '0' || workerId === 'standalone') {
  syncAllSequences().catch(err => console.error('[Server] Sequence sync failed:', err));
}

// In-memory state stores for Live Language Rooms
const roomWhiteboardState = new Map(); // roomName -> { isOpen: boolean, elements: [], mode: 'speakers', allowedIds: [] }
const roomChatState = new Map(); // roomName -> [ { id, from, text, time } ] (sliding window of 60 messages)
const roomSettingsState = new Map(); // roomName -> { allowWhiteboard: boolean, allowScreenShare: boolean }

function getRoomWhiteboard(roomName) {
  if (!roomWhiteboardState.has(roomName)) {
    roomWhiteboardState.set(roomName, {
      isOpen: false,
      elements: [],
      mode: 'speakers',
      allowedIds: []
    });
  }
  return roomWhiteboardState.get(roomName);
}

function getRoomChat(roomName) {
  if (!roomChatState.has(roomName)) {
    roomChatState.set(roomName, []);
  }
  return roomChatState.get(roomName);
}

function getRoomSettings(roomName) {
  if (!roomSettingsState.has(roomName)) {
    roomSettingsState.set(roomName, {
      allowWhiteboard: false,
      allowScreenShare: false
    });
  }
  return roomSettingsState.get(roomName);
}

io.on('connection', (socket) => {
  console.log('Social Socket connected:', socket.id);

  socket.on('join', async (userId) => {
    if (!userId) return;
    
    const userIdStr = userId.toString();
    socket.userId = userIdStr;
    socket.join(userIdStr);
    
    const socketSetKey = `user:sockets:${userIdStr}`;
    const workerSocketsKey = `worker:sockets:${workerId}`;
    
    try {
      await redis.sadd(socketSetKey, socket.id);
      await redis.expire(socketSetKey, 86400); // 24h expiration fallback
      
      await redis.sadd(workerSocketsKey, `${userIdStr}:${socket.id}`);
      await redis.expire(workerSocketsKey, 86400);
      
      const isNewOnline = await redis.sadd('online_users', userIdStr);
      
      const onlineUsers = await redis.smembers('online_users');
      socket.emit('getOnlineUsers', onlineUsers);
      
      if (isNewOnline === 1) {
        io.emit('userStatus', { userId: userIdStr, online: true });
      }
    } catch (err) {
      console.error('[Socket.io] Error in join handler:', err);
    }
  });

  socket.on('sendMessage', async (data) => {
    const { receiverId, message } = data;
    try {
      const savedMessage = await datingPrisma.message.create({
        data: {
          senderId: message.senderId,
          receiverId: parseInt(receiverId),
          content: message.content,
        }
      });

      // Invalidate receiver's unread cache immediately
      try {
        await cacheService.del(`user:unread:${receiverId}`);
      } catch (err) {
        console.error('Failed to invalidate unread cache on sendMessage:', err);
      }

      // Emit to receiver
      io.to(receiverId.toString()).emit('receiveMessage', savedMessage);
      // Emit confirmation back to sender so their message is DB-synced
      socket.emit('messageSent', savedMessage);

      // Send Push Notification
      try {
        const sender = await datingPrisma.user.findUnique({
          where: { id: message.senderId },
          select: { name: true }
        });
        const senderName = sender ? sender.name : 'A friend';
        sendPushNotification(
          [parseInt(receiverId)],
          `New message from ${senderName}`,
          message.content,
          { type: 'CHAT_MESSAGE', senderId: String(message.senderId) }
        );
      } catch (pushErr) {
        console.error('Error sending push notification for direct message:', pushErr.message);
      }
    } catch (error) {
      console.error('Error saving socket message:', error);
      socket.emit('messageError', { error: 'Failed to send message' });
    }
  });

  // Typing Indicator Signaling
  socket.on('typing', (data) => {
    if (!data || !data.targetId) return;
    io.to(data.targetId.toString()).emit('userTyping', {
      senderId: socket.userId,
      isTyping: data.isTyping
    });
  });

  // Read Receipts Signaling
  socket.on('readReceipt', async (data) => {
    if (!data || !data.senderId) return;
    const receiverId = socket.userId;
    try {
      await datingPrisma.message.updateMany({
        where: {
          senderId: parseInt(data.senderId),
          receiverId: parseInt(receiverId),
          isRead: false
        },
        data: {
          isRead: true
        }
      });

      // Invalidate unread cache for the user receiving read receipt (marking read)
      try {
        await cacheService.del(`user:unread:${receiverId}`);
      } catch (err) {
        console.error('Failed to invalidate unread cache on readReceipt:', err);
      }

      io.to(data.senderId.toString()).emit('messagesRead', {
        readerId: receiverId
      });
    } catch (err) {
      console.error('Error updating read receipt:', err);
    }
  });

  // Message Reaction Signaling
  socket.on('messageReaction', async (data) => {
    const { messageId, isGroup, emoji } = data;
    if (!messageId || !emoji) return;
    const userId = socket.userId;
    try {
      let message;
      if (isGroup) {
        message = await datingPrisma.groupMessage.findUnique({
          where: { id: parseInt(messageId) }
        });
      } else {
        message = await datingPrisma.message.findUnique({
          where: { id: parseInt(messageId) }
        });
      }

      if (!message) return;

      // Parse current content
      let contentData = {};
      try {
        contentData = JSON.parse(message.content);
        if (typeof contentData !== 'object' || contentData === null) {
          contentData = { text: message.content };
        }
      } catch (e) {
        contentData = { text: message.content };
      }

      if (!contentData.reactions) {
        contentData.reactions = {};
      }
      if (!contentData.reactions[emoji]) {
        contentData.reactions[emoji] = [];
      }

      const users = contentData.reactions[emoji];
      const index = users.indexOf(userId);
      if (index > -1) {
        // Toggle reaction off
        users.splice(index, 1);
      } else {
        // Add reaction
        users.push(userId);
      }

      if (users.length === 0) {
        delete contentData.reactions[emoji];
      }

      const updatedContent = JSON.stringify(contentData);

      // Save to database
      if (isGroup) {
        await datingPrisma.groupMessage.update({
          where: { id: parseInt(messageId) },
          data: { content: updatedContent }
        });
        
        // Broadcast to group room
        io.to(`group-${message.groupId}`).emit('messageReactionUpdated', {
          messageId,
          isGroup: true,
          reactions: contentData.reactions
        });
      } else {
        await datingPrisma.message.update({
          where: { id: parseInt(messageId) },
          data: { content: updatedContent }
        });

        // Broadcast to both sender and receiver
        io.to(message.senderId.toString()).emit('messageReactionUpdated', {
          messageId,
          isGroup: false,
          reactions: contentData.reactions
        });
        io.to(message.receiverId.toString()).emit('messageReactionUpdated', {
          messageId,
          isGroup: false,
          reactions: contentData.reactions
        });
      }
    } catch (err) {
      console.error('Error handling reaction:', err);
    }
  });

  socket.on('joinGroup', (groupId) => {
    if (!groupId) return;
    socket.join(`group-${groupId}`);
    console.log(`Social Socket ${socket.id} joined group room: group-${groupId}`);
  });

  socket.on('sendGroupMessage', (message) => {
    if (!message || !message.groupId) return;
    io.to(`group-${message.groupId}`).emit('receiveGroupMessage', message);
  });

  socket.on('deleteMessage', (data) => {
    if (!data || !data.messageId || !data.receiverId) return;
    io.to(data.receiverId.toString()).emit('messageDeleted', { messageId: data.messageId });
  });

  socket.on('deleteGroupMessage', (data) => {
    if (!data || !data.messageId || !data.groupId) return;
    io.to(`group-${data.groupId}`).emit('groupMessageDeleted', { messageId: data.messageId });
  });

  socket.on('disconnect', async () => {
    const userIdStr = socket.userId;
    if (userIdStr) {
      const socketSetKey = `user:sockets:${userIdStr}`;
      const workerSocketsKey = `worker:sockets:${workerId}`;
      
      try {
        await redis.srem(socketSetKey, socket.id);
        await redis.srem(workerSocketsKey, `${userIdStr}:${socket.id}`);
        
        const activeCount = await redis.scard(socketSetKey);
        if (activeCount === 0) {
          await redis.srem('online_users', userIdStr);
          await redis.del(socketSetKey);
          io.emit('userStatus', { userId: userIdStr, online: false });
        }
      } catch (err) {
        console.error('[Socket.io] Error in disconnect handler:', err);
      }
    }
  });

  // ── Live Room General State & Chat Relay ──
  socket.on('joinLiveRoom', (payload) => {
    const roomName = typeof payload === 'string' ? payload : payload?.roomName;
    if (!roomName) return;
    const roomChannel = `live_room_${roomName}`;
    socket.join(roomChannel);

    const wb = getRoomWhiteboard(roomName);
    const chat = getRoomChat(roomName);
    const settings = getRoomSettings(roomName);

    // Provide complete synchronization snapshot to the joining client
    socket.emit('liveRoomSyncState', {
      isWhiteboardOpen: wb.isOpen,
      whiteboardMode: wb.mode,
      whiteboardAllowedIds: wb.allowedIds,
      chatHistory: chat,
      allowWhiteboard: settings.allowWhiteboard,
      allowScreenShare: settings.allowScreenShare,
    });
  });

  socket.on('leaveLiveRoom', (payload) => {
    const roomName = typeof payload === 'string' ? payload : payload?.roomName;
    if (!roomName) return;
    socket.leave(`live_room_${roomName}`);
  });

  // Host updates room settings
  socket.on('updateLiveRoomSettings', ({ roomName, allowWhiteboard, allowScreenShare }) => {
    if (!roomName) return;
    const settings = getRoomSettings(roomName);
    if (typeof allowWhiteboard === 'boolean') settings.allowWhiteboard = allowWhiteboard;
    if (typeof allowScreenShare === 'boolean') settings.allowScreenShare = allowScreenShare;

    io.to(`live_room_${roomName}`).emit('liveRoomSettingsUpdated', {
      allowWhiteboard: settings.allowWhiteboard,
      allowScreenShare: settings.allowScreenShare
    });
  });

  // Real-time Chat
  socket.on('sendLiveRoomChat', ({ roomName, message, sender }) => {
    if (!roomName || !message || typeof message !== 'string' || !message.trim()) return;
    const chatHistory = getRoomChat(roomName);
    const chatItem = {
      id: `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      roomName,
      from: sender?.name || sender?.userName || 'User',
      senderId: sender?.identity || sender?.id || 'anonymous',
      text: message.trim(),
      timestamp: Date.now(),
      sentAt: new Date().toISOString()
    };

    // Append to sliding window (keep last 60 messages)
    chatHistory.push(chatItem);
    if (chatHistory.length > 60) {
      chatHistory.shift();
    }

    // Broadcast message to everyone in the room
    io.to(`live_room_${roomName}`).emit('liveRoomChatReceived', chatItem);
  });

  // Client requests chat history
  socket.on('getLiveRoomChatHistory', ({ roomName }) => {
    if (!roomName) return;
    socket.emit('liveRoomChatHistory', getRoomChat(roomName));
  });

  // Whiteboard visibility toggle (Host or participant with permission)
  socket.on('setWhiteboardVisibility', ({ roomName, isOpen }) => {
    if (!roomName) return;
    const wb = getRoomWhiteboard(roomName);
    wb.isOpen = Boolean(isOpen);
    io.to(`live_room_${roomName}`).emit('whiteboardVisibilityChanged', { isOpen: wb.isOpen });
  });

  // Live Room Whiteboard Dual-Layer Relay Channel
  socket.on('joinRoomWhiteboard', (roomName) => {
    if (roomName) {
      socket.join(`whiteboard_room_${roomName}`);
    }
  });

  socket.on('leaveRoomWhiteboard', (roomName) => {
    if (roomName) {
      socket.leave(`whiteboard_room_${roomName}`);
    }
  });

  // Client requests full whiteboard state & drawings history
  socket.on('requestWhiteboardSync', ({ roomName }) => {
    if (!roomName) return;
    const wb = getRoomWhiteboard(roomName);
    socket.emit('whiteboardSyncResponse', {
      elements: wb.elements,
      mode: wb.mode,
      allowedIds: wb.allowedIds,
      isOpen: wb.isOpen
    });
  });

  socket.on('whiteboardPacket', (data) => {
    if (!data || !data.roomName || !data.payload) return;
    const { roomName, payload } = data;
    const wb = getRoomWhiteboard(roomName);

    // Save persistent elements/strokes so late joiners can see them
    if (payload.type === 'DRAW_ELEMENT' && payload.element) {
      const elemId = payload.element.id || payload.element.strokeId;
      const exists = elemId && wb.elements.some(e => (e.id || e.strokeId) === elemId);
      if (!exists) {
        wb.elements.push(payload.element);
        if (wb.elements.length > 2000) wb.elements.shift();
      }
    } else if (payload.type === 'CLEAR') {
      wb.elements = [];
    } else if (payload.type === 'UNDO') {
      if (payload.id) {
        wb.elements = wb.elements.filter(e => (e.id || e.strokeId) !== payload.id);
      } else {
        wb.elements.pop();
      }
    } else if (payload.type === 'DRAW_PERMISSIONS_UPDATE') {
      if (payload.mode) wb.mode = payload.mode;
      if (Array.isArray(payload.allowedIds)) wb.allowedIds = payload.allowedIds;
    } else if (payload.type === 'SYNC_RESPONSE' && Array.isArray(payload.elements)) {
      wb.elements = payload.elements;
      if (payload.mode) wb.mode = payload.mode;
      if (Array.isArray(payload.allowedIds)) wb.allowedIds = payload.allowedIds;
    }

    // Broadcast packet to peers in whiteboard room
    socket.to(`whiteboard_room_${roomName}`).emit('whiteboardPacket', payload);
  });
});

// ─── CORS ────────────────────────────────────────────────────────────────────
// Explicit CORS config — bare cors() without options caused Chrome to block
// cross-origin image requests from /media (Safari was more lenient).
const corsOptions = {
  origin: (origin, callback) => {
    // Allow all origins: web browsers, deployed domains, mobile apps, TWAs, etc.
    callback(null, origin || '*');
  },
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  credentials: true,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Pre-flight for all routes
// Gzip compress all responses — reduces API payload size by 60-80%
app.use(compression({ level: 5, threshold: 1024 }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
// Only log verbosely in development — dev format is synchronous and slow in production
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    skip: (req) => req.url === '/health' // skip health check noise
  }));
}
// ─── Static files with explicit CORS headers ────────────────────────────────
// express.static() bypasses the global cors() middleware, so we must attach
// CORS headers manually. Without this, Chrome blocks /media images as
// cross-origin while Safari allows them (Chrome-only bug).
const staticCors = (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
};
app.use('/media', staticCors, express.static('media'));          // Serve static media files
app.use('/api/media', staticCors, express.static('media'));      // Compatibility for Passenger routing
app.use('/apps', staticCors, express.static(path.join(__dirname, 'apps')));      // Serve desktop apps
app.use('/api/apps', staticCors, express.static(path.join(__dirname, 'apps'))); // Passenger compatibility for apps

// Routes
app.use('/api', apiRoutes);
app.use('/api', datingRoutes);
app.use('/', apiRoutes); // Fallback for Hostinger/Passenger stripped routes
app.use('/', datingRoutes); // Fallback for Hostinger/Passenger stripped routes

// Health check endpoint (used by PM2, Cloudflare, and load balancers)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Root endpoint
app.get('/', (req, res) => {
    res.send('LearnProof Express API is running!');
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Listen using the HTTP server
server.listen(PORT, () => {
    console.log(`Express server running on http://localhost:${PORT}`);

    // Periodically check scheduled rooms every 15s to trigger start notifications on time
    const { checkScheduledRoomsToStart } = require('./src/controllers/datingController');
    setInterval(() => {
        checkScheduledRoomsToStart(io).catch(err => {
            console.error('[Scheduled Rooms] Background start check failed:', err.message);
        });
    }, 15000);
});

// Graceful shutdown — important for PM2 cluster mode
// When PM2 restarts a worker, give in-flight requests 10s to complete
const prisma = require('./src/lib/prisma');
const datingPrismaClient = require('./src/utils/datingPrisma');
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(async () => {
        await prisma.$disconnect();
        await datingPrismaClient.$disconnect();
        process.exit(0);
    });
    // Force exit after 10s if connections don't close
    setTimeout(() => process.exit(1), 10000);
});
