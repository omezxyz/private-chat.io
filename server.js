const express = require('express');
const http = require('http');
const WebSocket = require('ws');

// Create an Express app
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// In-memory storage for chat rooms
const chatRooms = {};

// Serve static files from the "public" directory
app.use(express.static('public'));

// WebSocket server
wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'create-room') {
      const { roomId, password, nickname } = data;

      if (!chatRooms[roomId]) {
        chatRooms[roomId] = { password, clients: [] };
        ws.nickname = nickname || 'Anonymous';
        ws.roomId = roomId;
        chatRooms[roomId].clients.push(ws);

        ws.send(JSON.stringify({ type: 'room-created', roomId }));
      } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Room already exists' }));
      }
    } else if (data.type === 'join-room') {
      const { roomId, password, nickname } = data;

      if (chatRooms[roomId] && chatRooms[roomId].password === password) {
        ws.nickname = nickname || 'Anonymous';
        ws.roomId = roomId;
        chatRooms[roomId].clients.push(ws);

        ws.send(JSON.stringify({ type: 'joined-room', roomId }));
      } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid room or password' }));
      }
    } else if (data.type === 'message') {
      const { roomId, message } = data;

      if (chatRooms[roomId]) {
        chatRooms[roomId].clients.forEach((client) => {
          // Exclude the sender from receiving their own message
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'message',
              nickname: ws.nickname,
              message
            }));
          }
        });
      }
    } else if (data.type === 'typing') {
      const { roomId } = data;

      if (chatRooms[roomId]) {
        chatRooms[roomId].clients.forEach((client) => {
          // Exclude the sender from receiving the typing notification
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'typing', nickname: ws.nickname }));
          }
        });
      }
    }
  });

  ws.on('close', () => {
    if (ws.roomId && chatRooms[ws.roomId]) {
      chatRooms[ws.roomId].clients = chatRooms[ws.roomId].clients.filter((client) => client !== ws);

      // Clean up empty rooms
      if (chatRooms[ws.roomId].clients.length === 0) {
        delete chatRooms[ws.roomId];
      }
    }
  });
});

// Start the server on the dynamic Render port
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});