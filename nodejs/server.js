const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const http = require('http');
const { Server } = require('socket.io');
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
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'https://learnproofai.com', 'https://www.learnproofai.com'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

app.set('io', io);

// Mount Socket.io handler
const datingPrisma = require('./src/utils/datingPrisma');
const { sendPushNotification } = require('./src/utils/pushNotifier');
const userSockets = new Map(); // userId -> Set of socketIds

io.on('connection', (socket) => {
  console.log('Social Socket connected:', socket.id);

  socket.on('join', async (userId) => {
    if (!userId) return;
    
    const userIdStr = userId.toString();
    socket.userId = userIdStr;
    socket.join(userIdStr);
    
    if (!userSockets.has(userIdStr)) {
      userSockets.set(userIdStr, new Set());
    }
    userSockets.get(userIdStr).add(socket.id);
    
    // Send back online list to the joining user only
    socket.emit('getOnlineUsers', Array.from(userSockets.keys()));

    // Notify only this user's friends (not ALL connected sockets)
    try {
      const friendships = await datingPrisma.friendship.findMany({
        where: { status: 'accepted', OR: [{ senderId: parseInt(userIdStr) }, { receiverId: parseInt(userIdStr) }] },
        select: { senderId: true, receiverId: true }
      });
      friendships.forEach(f => {
        const friendId = f.senderId === parseInt(userIdStr) ? f.receiverId : f.senderId;
        io.to(friendId.toString()).emit('userStatus', { userId: userIdStr, online: true });
      });
    } catch (e) { /* non-critical */ }
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
    if (userIdStr && userSockets.has(userIdStr)) {
      const sockets = userSockets.get(userIdStr);
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        userSockets.delete(userIdStr);
        // Notify only friends — not ALL connected users
        try {
          const friendships = await datingPrisma.friendship.findMany({
            where: { status: 'accepted', OR: [{ senderId: parseInt(userIdStr) }, { receiverId: parseInt(userIdStr) }] },
            select: { senderId: true, receiverId: true }
          });
          friendships.forEach(f => {
            const friendId = f.senderId === parseInt(userIdStr) ? f.receiverId : f.senderId;
            io.to(friendId.toString()).emit('userStatus', { userId: userIdStr, online: false });
          });
        } catch (e) { /* non-critical */ }
      }
    }
  });
});

// Middleware
app.use(cors());
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
app.use('/media', express.static('media')); // Serve static media files
app.use('/api/media', express.static('media')); // Compatibility for Passenger routing
app.use('/apps', express.static(path.join(__dirname, 'apps'))); // Serve desktop apps
app.use('/api/apps', express.static(path.join(__dirname, 'apps'))); // Passenger compatibility for apps

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
