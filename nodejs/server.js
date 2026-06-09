const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const apiRoutes = require('./src/routes/api');
const datingRoutes = require('./src/routes/datingRoutes');

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

// Mount Socket.io handler
const datingPrisma = require('./src/utils/datingPrisma');
const onlineUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log('Social Socket connected:', socket.id);

  socket.on('join', (userId) => {
    console.log(`Social Socket join: ${userId}`);
    if (!userId) return;
    
    socket.join(userId.toString());
    onlineUsers.set(userId.toString(), socket.id);
    
    // Broadcast status
    io.emit('userStatus', { userId: userId.toString(), online: true });
    
    // Send back online list
    socket.emit('getOnlineUsers', Array.from(onlineUsers.keys()));
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

  socket.on('disconnect', () => {
    let disconnectedUserId = null;
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
        break;
      }
    }
    
    if (disconnectedUserId) {
      onlineUsers.delete(disconnectedUserId);
      console.log(`Social User disconnected: ${disconnectedUserId}`);
      io.emit('userStatus', { userId: disconnectedUserId, online: false });
    }
  });
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(morgan('dev'));
app.use('/media', express.static('media')); // Serve static media files
app.use('/api/media', express.static('media')); // Compatibility for Passenger routing

// Routes
app.use('/api', apiRoutes);
app.use('/api', datingRoutes);
app.use('/', apiRoutes); // Fallback for Hostinger/Passenger stripped routes

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
