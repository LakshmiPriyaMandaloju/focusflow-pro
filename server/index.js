const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
const port = process.env.PORT || 5000;

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000'
}));
app.use(express.json());

app.set('io', io);

app.get('/', (req, res) => {
  res.json({ message: 'FocusFlow Pro API running!' });
});

app.use('/api/auth',    require('./routes/auth'));
app.use('/api/session', require('./routes/session'));
app.use('/api/block',   require('./routes/block'));
app.use('/api/stats',   require('./routes/stats'));
app.use('/api/goals',   require('./routes/goals'));
app.use('/api/social',  require('./routes/social'));

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    io.to(roomId).emit('room-update', {
      event: 'user-joined',
      socketId: socket.id
    });
  });

  socket.on('session-started', (data) => {
    socket.to(data.roomId).emit('peer-session-started', data);
  });

  socket.on('session-ended', (data) => {
    socket.to(data.roomId).emit('peer-session-ended', data);
  });

  socket.on('distraction-attempt', (data) => {
    socket.to(data.roomId).emit('peer-distraction', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

cron.schedule('0 9 * * *', async () => {
  console.log('Running daily reminder check...');
});

cron.schedule('0 20 * * 0', async () => {
  console.log('Running weekly report generation...');
});

const PORT = process.env.PORT || 5000;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} busy, trying ${parseInt(PORT) + 1}...`);
    server.listen(parseInt(PORT) + 1);
  }
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`FocusFlow Pro running on port ${PORT}`);
    });
  })
  .catch((err) => console.log('DB error:', err));