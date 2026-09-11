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
const livekitService = require('./src/services/livekit.service');
const livekitController = require('./src/controllers/livekit.controller');
const redis = require('./src/lib/redis');

// In-memory grace period timers for host disconnects (roomName -> timer)
const hostDisconnectTimers = new Map();

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

// Distributed shared state stores for Live Language Rooms (Redis-backed across PM2 cluster)
const roomWhiteboardState = new Map(); // local cache fallback
const roomChatState = new Map();
const roomSettingsState = new Map();

async function getRoomWhiteboard(roomName) {
  if (!roomName) return { isOpen: false, elements: [], mode: 'speakers', allowedIds: [] };
  try {
    const raw = await redis.get(`live_room:wb:${roomName}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      roomWhiteboardState.set(roomName, parsed);
      return parsed;
    }
  } catch (err) {
    console.error('[LiveRoom] Redis getRoomWhiteboard error:', err.message);
  }
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

async function saveRoomWhiteboard(roomName, wb) {
  if (!roomName || !wb) return;
  roomWhiteboardState.set(roomName, wb);
  try {
    await redis.set(`live_room:wb:${roomName}`, JSON.stringify(wb), 'EX', 86400);
  } catch (err) {
    console.error('[LiveRoom] Redis saveRoomWhiteboard error:', err.message);
  }
}

async function getRoomChat(roomName) {
  if (!roomName) return [];
  try {
    const raw = await redis.get(`live_room:chat:${roomName}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      roomChatState.set(roomName, parsed);
      return parsed;
    }
  } catch (err) {
    console.error('[LiveRoom] Redis getRoomChat error:', err.message);
  }
  if (!roomChatState.has(roomName)) {
    roomChatState.set(roomName, []);
  }
  return roomChatState.get(roomName);
}

async function saveRoomChat(roomName, chat) {
  if (!roomName || !chat) return;
  roomChatState.set(roomName, chat);
  try {
    await redis.set(`live_room:chat:${roomName}`, JSON.stringify(chat), 'EX', 86400);
  } catch (err) {
    console.error('[LiveRoom] Redis saveRoomChat error:', err.message);
  }
}

async function getRoomSettings(roomName) {
  if (!roomName) return { allowWhiteboard: false, allowScreenShare: false };
  try {
    const raw = await redis.get(`live_room:settings:${roomName}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      roomSettingsState.set(roomName, parsed);
      return parsed;
    }
  } catch (err) {
    console.error('[LiveRoom] Redis getRoomSettings error:', err.message);
  }
  if (!roomSettingsState.has(roomName)) {
    roomSettingsState.set(roomName, {
      allowWhiteboard: false,
      allowScreenShare: false
    });
  }
  return roomSettingsState.get(roomName);
}

async function saveRoomSettings(roomName, settings) {
  if (!roomName || !settings) return;
  roomSettingsState.set(roomName, settings);
  try {
    await redis.set(`live_room:settings:${roomName}`, JSON.stringify(settings), 'EX', 86400);
  } catch (err) {
    console.error('[LiveRoom] Redis saveRoomSettings error:', err.message);
  }
}

io.on('connection', (socket) => {
  console.log('Social Socket connected:', socket.id);

  socket.on('join', async (userId) => {
    if (!userId) return;
    
    const userIdStr = userId.toString();
    socket.userId = userIdStr;
    socket.join(userIdStr);
    socket.join(`user_${userIdStr}`);
    
    const socketSetKey = `user:sockets:${userIdStr}`;
    const workerSocketsKey = `worker:sockets:${workerId}`;
    
    try {
      await redis.sadd(socketSetKey, socket.id);
      await redis.expire(socketSetKey, 86400); // 24h expiration fallback
      
      await redis.sadd(workerSocketsKey, `${userIdStr}:${socket.id}`);
      await redis.expire(workerSocketsKey, 86400);
      
      const isNewOnline = await redis.sadd('online_users', userIdStr);
      await redis.del(`user:backgrounded:${userIdStr}`);
      
      const onlineUsers = await redis.smembers('online_users');
      socket.emit('getOnlineUsers', onlineUsers);
      
      if (isNewOnline === 1) {
        io.emit('userStatus', { userId: userIdStr, online: true });
      }
    } catch (err) {
      console.error('[Socket.io] Error in join handler:', err);
    }
  });

  socket.isAppActive = true;

  socket.on('presence:foreground', async () => {
    socket.isAppActive = true;
    if (socket.userId) {
      await redis.del(`user:backgrounded:${socket.userId}`);
    }
  });

  socket.on('presence:background', async () => {
    socket.isAppActive = false;
    if (socket.userId) {
      await redis.set(`user:backgrounded:${socket.userId}`, '1', 'EX', 86400);
    }
  });

  // Track when user is actively inside a chat thread to suppress redundant push notifications
  socket.on('chat:enter', async (data) => {
    if (!socket.userId || !data) return;
    const target = data.groupId ? `group:${data.groupId}` : `user:${data.targetUserId}`;
    socket.activeChatTarget = target;
    try {
      await redis.set(`user:active_chat:${socket.userId}`, target, 'EX', 86400);
      console.log(`[Socket.io] User ${socket.userId} entered chat: ${target}`);
    } catch (e) {
      console.error('Error setting user:active_chat:', e.message);
    }
  });

  socket.on('chat:leave', async () => {
    if (!socket.userId) return;
    socket.activeChatTarget = null;
    try {
      await redis.del(`user:active_chat:${socket.userId}`);
      console.log(`[Socket.io] User ${socket.userId} left chat`);
    } catch (e) {
      console.error('Error deleting user:active_chat:', e.message);
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
        },
        include: {
          sender: {
            select: { id: true, name: true, profilePicture: true }
          }
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

      // Dispatch push notification to receiver's devices (client-side service worker & OS gatekeep visibility)
      try {
        const senderName = savedMessage.sender?.name || 'A friend';
        sendPushNotification(
          [parseInt(receiverId)],
          `New message from ${senderName}`,
          message.content,
          { 
            type: 'CHAT_MESSAGE', 
            senderId: String(message.senderId),
            senderName: senderName,
            senderPicture: (savedMessage.sender?.profilePicture && !savedMessage.sender.profilePicture.startsWith('data:') && savedMessage.sender.profilePicture.length < 500) ? savedMessage.sender.profilePicture : ''
          }
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
          await redis.del(`user:backgrounded:${userIdStr}`);
          await redis.del(`user:active_chat:${userIdStr}`);
          io.emit('userStatus', { userId: userIdStr, online: false });
        }
      } catch (err) {
        console.error('[Socket.io] Error in disconnect handler:', err);
      }
    }

    // If a non-host participant disconnects, clean up their approved stage speaker status
    if (socket.activeLiveRoom && socket.userId && !socket.isLiveRoomHost) {
      livekitController.removeApprovedSpeaker(socket.activeLiveRoom, socket.userId);
    }

    // If this socket was the host of an active live room, trigger delayed room closure check
    if (socket.isLiveRoomHost && socket.activeLiveRoom) {
      const roomName = socket.activeLiveRoom;
      const hostUserId = socket.userId;
      if (hostDisconnectTimers.has(roomName)) {
        clearTimeout(hostDisconnectTimers.get(roomName));
      }

      // Allow 3 minutes (180s) grace period for reconnects, tab refreshes, or network handover
      const timer = setTimeout(async () => {
        hostDisconnectTimers.delete(roomName);

        // 1. Check if the host user still has an active socket connection on the platform
        if (hostUserId) {
          try {
            const socketSetKey = `user:sockets:${hostUserId}`;
            const activeCount = await redis.scard(socketSetKey);
            if (activeCount > 0) {
              console.log(`[LiveRoom] Host user ${hostUserId} is still connected via another socket. Keeping room: ${roomName}`);
              return;
            }
          } catch (_) {}
        }

        // 2. Check if participants or host are still connected in LiveKit
        try {
          const lkParticipants = await livekitService.listParticipants(roomName);
          if (Array.isArray(lkParticipants) && lkParticipants.length > 0) {
            console.log(`[LiveRoom] Room ${roomName} still has ${lkParticipants.length} active participants in LiveKit. Keeping room alive.`);
            return;
          }
        } catch (_) {}

        // 3. Only if completely empty and host never returned after 3 minutes, clean up
        console.log(`[LiveRoom] Host disconnected timeout (180s) expired and room ${roomName} is empty. Ending meeting.`);
        io.to(`live_room_${roomName}`).emit('room_ended');
        try {
          await livekitService.deleteRoom(roomName);
        } catch (_) {}
        try {
          await datingPrisma.languageRoom.deleteMany({ where: { roomName } });
          await cacheService.delByPattern('user:live-rooms:*');
          io.emit('ROOMS_UPDATED');
        } catch (err) {
          console.error('[LiveRoom] Error cleaning up room on host disconnect:', err.message);
        }
      }, 180000);

      hostDisconnectTimers.set(roomName, timer);
    }
  });

  // ── Live Room General State & Chat Relay ──
  socket.on('joinLiveRoom', async (payload) => {
    const roomName = typeof payload === 'string' ? payload : payload?.roomName;
    if (!roomName) return;
    const roomChannel = `live_room_${roomName}`;
    socket.join(roomChannel);
    socket.join(`whiteboard_room_${roomName}`);
    socket.activeLiveRoom = roomName;

    // Track host status and cancel disconnect timer if host reloaded/reconnected
    if (payload?.isHost) {
      socket.isLiveRoomHost = true;
      if (hostDisconnectTimers.has(roomName)) {
        clearTimeout(hostDisconnectTimers.get(roomName));
        hostDisconnectTimers.delete(roomName);
        console.log(`[LiveRoom] Host reconnected to ${roomName}, cancelled disconnect timer.`);
      }
    }

    const wb = await getRoomWhiteboard(roomName);
    const chat = await getRoomChat(roomName);
    const settings = await getRoomSettings(roomName);

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
    socket.leave(`whiteboard_room_${roomName}`);
    if (socket.activeLiveRoom === roomName) {
      socket.activeLiveRoom = null;
      socket.isLiveRoomHost = false;
    }
    if (socket.userId) {
      livekitController.removeApprovedSpeaker(roomName, socket.userId);
    }
  });

  // Host explicitly left the room / closed browser
  socket.on('hostLeftLiveRoom', async ({ roomName }) => {
    if (!roomName) return;
    console.log(`[LiveRoom] Host explicitly left room ${roomName}, ending session.`);
    io.to(`live_room_${roomName}`).emit('room_ended');
    try {
      await livekitService.deleteRoom(roomName);
    } catch (_) {}
    try {
      await datingPrisma.languageRoom.deleteMany({ where: { roomName } });
      await cacheService.delByPattern('user:live-rooms:*');
      await redis.del(`live_room:wb:${roomName}`);
      await redis.del(`live_room:chat:${roomName}`);
      await redis.del(`live_room:settings:${roomName}`);
      roomWhiteboardState.delete(roomName);
      roomChatState.delete(roomName);
      roomSettingsState.delete(roomName);
      io.emit('ROOMS_UPDATED');
    } catch (err) {
      console.error('[LiveRoom] Error cleaning up room on host leave:', err.message);
    }
  });

  // Host updates room settings
  socket.on('updateLiveRoomSettings', async ({ roomName, allowWhiteboard, allowScreenShare }) => {
    if (!roomName) return;
    const settings = await getRoomSettings(roomName);
    if (typeof allowWhiteboard === 'boolean') settings.allowWhiteboard = allowWhiteboard;
    if (typeof allowScreenShare === 'boolean') settings.allowScreenShare = allowScreenShare;
    await saveRoomSettings(roomName, settings);

    io.to(`live_room_${roomName}`).emit('liveRoomSettingsUpdated', {
      allowWhiteboard: settings.allowWhiteboard,
      allowScreenShare: settings.allowScreenShare
    });
  });

  // Real-time Chat
  socket.on('sendLiveRoomChat', async ({ roomName, message, sender }) => {
    if (!roomName || !message || typeof message !== 'string' || !message.trim()) return;

    const roomChannel = `live_room_${roomName}`;
    socket.join(roomChannel);

    const chatHistory = await getRoomChat(roomName);
    const senderIdentity = String(sender?.identity || sender?.id || socket.userId || 'anonymous');
    const senderName = sender?.name || sender?.userName || 'User';
    const senderAvatar = sender?.profilePicture || sender?.avatar || sender?.photoURL || null;

    const chatItem = {
      id: `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      roomName,
      from: { identity: senderIdentity, name: senderName, profilePicture: senderAvatar },
      senderId: senderIdentity,
      senderName,
      profilePicture: senderAvatar,
      text: message.trim(),
      timestamp: Date.now(),
      sentAt: new Date().toISOString()
    };

    // Append to sliding window (keep last 60 messages)
    chatHistory.push(chatItem);
    if (chatHistory.length > 60) {
      chatHistory.shift();
    }
    await saveRoomChat(roomName, chatHistory);

    // Broadcast message to everyone in the room (including sender)
    io.to(roomChannel).emit('liveRoomChatReceived', chatItem);
  });

  // Client requests chat history
  socket.on('getLiveRoomChatHistory', async ({ roomName }) => {
    if (!roomName) return;
    const chat = await getRoomChat(roomName);
    socket.emit('liveRoomChatHistory', chat);
  });

  // Whiteboard visibility toggle (Host or participant with permission)
  socket.on('setWhiteboardVisibility', async ({ roomName, isOpen }) => {
    if (!roomName) return;
    const wb = await getRoomWhiteboard(roomName);
    wb.isOpen = Boolean(isOpen);
    await saveRoomWhiteboard(roomName, wb);

    if (wb.isOpen) {
      const settings = await getRoomSettings(roomName);
      settings.allowWhiteboard = true;
      await saveRoomSettings(roomName, settings);
      io.to(`live_room_${roomName}`).emit('liveRoomSettingsUpdated', {
        allowWhiteboard: true,
        allowScreenShare: settings.allowScreenShare
      });
    }

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

  socket.on('clearRoomWhiteboard', async ({ roomName }) => {
    if (!roomName) return;
    try {
      await redis.del(`live_room:wb:${roomName}`);
      roomWhiteboardState.delete(roomName);
      io.to(`whiteboard_room_${roomName}`).emit('whiteboardPacket', { type: 'CLEAR' });
    } catch (err) {
      console.error('[LiveRoom] Error clearing room whiteboard:', err.message);
    }
  });

  // Client explicitly requests complete room sync state (for late joiners or reconnects)
  socket.on('getLiveRoomSyncState', async ({ roomName }) => {
    if (!roomName) return;
    socket.join(`live_room_${roomName}`);
    socket.join(`whiteboard_room_${roomName}`);
    const wb = await getRoomWhiteboard(roomName);
    const chat = await getRoomChat(roomName);
    const settings = await getRoomSettings(roomName);
    socket.emit('liveRoomSyncState', {
      isWhiteboardOpen: wb.isOpen,
      whiteboardMode: wb.mode,
      whiteboardAllowedIds: wb.allowedIds,
      chatHistory: chat,
      allowWhiteboard: settings.allowWhiteboard,
      allowScreenShare: settings.allowScreenShare,
    });
  });

  // Client requests full whiteboard state & drawings history
  socket.on('requestWhiteboardSync', async ({ roomName }) => {
    if (!roomName) return;
    socket.join(`whiteboard_room_${roomName}`);
    const wb = await getRoomWhiteboard(roomName);
    socket.emit('whiteboardSyncResponse', {
      elements: wb.elements,
      mode: wb.mode,
      allowedIds: wb.allowedIds,
      isOpen: wb.isOpen
    });
  });

  socket.on('whiteboardPacket', async (data) => {
    if (!data || !data.roomName || !data.payload) return;
    const { roomName, payload } = data;
    socket.join(`whiteboard_room_${roomName}`);
    const wb = await getRoomWhiteboard(roomName);

    let needsSave = false;
    // Save persistent elements/strokes so late joiners can see them (handles both shapes DRAW_ELEMENT and pen STROKE_END)
    if ((payload.type === 'DRAW_ELEMENT' || payload.type === 'STROKE_END') && payload.element) {
      const elemId = payload.element.id || payload.element.strokeId;
      const exists = elemId && wb.elements.some(e => (e.id || e.strokeId) === elemId);
      if (!exists) {
        wb.elements.push(payload.element);
        if (wb.elements.length > 2000) wb.elements.shift();
        needsSave = true;
      }
    } else if (payload.type === 'CLEAR') {
      wb.elements = [];
      needsSave = true;
    } else if (payload.type === 'UNDO') {
      if (payload.id) {
        wb.elements = wb.elements.filter(e => (e.id || e.strokeId) !== payload.id);
      } else {
        wb.elements.pop();
      }
      needsSave = true;
    } else if (payload.type === 'DRAW_PERMISSIONS_UPDATE') {
      if (payload.mode) wb.mode = payload.mode;
      if (Array.isArray(payload.allowedIds)) wb.allowedIds = payload.allowedIds;
      needsSave = true;
    } else if (payload.type === 'SYNC_RESPONSE' && Array.isArray(payload.elements)) {
      wb.elements = payload.elements;
      if (payload.mode) wb.mode = payload.mode;
      if (Array.isArray(payload.allowedIds)) wb.allowedIds = payload.allowedIds;
      needsSave = true;
    }

    if (needsSave) {
      await saveRoomWhiteboard(roomName, wb);
    }

    // Broadcast packet to peers in whiteboard room
    socket.to(`whiteboard_room_${roomName}`).emit('whiteboardPacket', payload);
  });

  // Stage Speak Requests Real-Time Relay
  socket.on('speak_request', (data) => {
    if (data && data.roomName) {
      io.to(`live_room_${data.roomName}`).emit('speak_request', data);
    }
  });

  socket.on('withdraw_stage_request', (data) => {
    if (data && data.roomName) {
      io.to(`live_room_${data.roomName}`).emit('withdraw_stage_request', data);
    }
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
