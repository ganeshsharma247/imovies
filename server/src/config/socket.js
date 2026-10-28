const { Server } = require('socket.io');
const env = require('./env');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join show room for real-time seat status synchronization
    socket.on('join_show', (showId) => {
      const room = `show_${showId}`;
      socket.join(room);
      console.log(`[Socket.IO] Client ${socket.id} joined room: ${room}`);
    });

    // Leave show room
    socket.on('leave_show', (showId) => {
      const room = `show_${showId}`;
      socket.leave(room);
      console.log(`[Socket.IO] Client ${socket.id} left room: ${room}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id} (reason: ${reason})`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet!');
  }
  return io;
}

module.exports = {
  initSocket,
  getIO,
};
