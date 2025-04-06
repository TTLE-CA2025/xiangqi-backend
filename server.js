const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// Bộ nhớ lưu người chơi trong phòng
const rooms = {};

server.listen(3001, () => {
  console.log('Server Socket.io đang chạy tại http://localhost:3001');
});

io.on('connection', (socket) => {
  console.log('Có người chơi mới kết nối:', socket.id);

  socket.on('joinRoom', ({ roomId, playerName }) => {
    socket.join(roomId);
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }
    rooms[roomId].push({ id: socket.id, name: playerName });
  
    console.log(`Socket ${socket.id} đã vào phòng ${roomId} với tên ${playerName}`);
  
    // Gửi danh sách người chơi trong phòng về cho tất cả client trong phòng
    io.to(roomId).emit('updatePlayers', rooms[roomId]);
  
    // ✅ Thêm dòng này: gửi ngay cho người vừa join
    socket.emit('updatePlayers', rooms[roomId]);
  }); 

  socket.on('move', ({ roomId, from, to }) => {
    socket.to(roomId).emit('move', { from, to });
  });

  socket.on('disconnect', () => {
    console.log('Người chơi đã ngắt kết nối:', socket.id);

    // Xóa người chơi khỏi phòng
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter(player => player.id !== socket.id);
      io.to(roomId).emit('updatePlayers', rooms[roomId]);
    }
  });
});
