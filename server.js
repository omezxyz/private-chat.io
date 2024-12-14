const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Persistent storage file
const ROOMS_FILE = path.join(__dirname, 'rooms.json');

// Load or initialize chat rooms
let chatRooms = {};
if (fs.existsSync(ROOMS_FILE)) {
  try {
    chatRooms = JSON.parse(fs.readFileSync(ROOMS_FILE, 'utf8')) || {};
  } catch (error) {
    console.error('Error reading rooms file:', error.message);
  }
}

// Save chat rooms to file
const saveRoomsToFile = () => {
  try {
    fs.writeFileSync(ROOMS_FILE, JSON.stringify(chatRooms, null, 2));
  } catch (error) {
    console.error('Error saving rooms file:', error.message);
  }
};

// Serve static files
app.use(express.static('public'));

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'create-room') {
        const { roomId, password, nickname } = data;

        if (!chatRooms[roomId]) {
          chatRooms[roomId] = {
            password,
            creator: nickname,
            clients: [],
          };
          saveRoomsToFile();
        }

        ws.nickname = nickname || 'Anonymous';
        ws.roomId = roomId;
        chatRooms[roomId].clients.push(ws);

        ws.send(JSON.stringify({ type: 'room-created', roomId }));
        broadcastOnlineUsers(roomId);
      } else if (data.type === 'join-room') {
        const { roomId, password, nickname } = data;

        if (chatRooms[roomId] && chatRooms[roomId].password === password) {
          ws.nickname = nickname || 'Anonymous';
          ws.roomId = roomId;
          chatRooms[roomId].clients.push(ws);

          ws.send(JSON.stringify({ type: 'joined-room', roomId }));
          broadcastOnlineUsers(roomId);
        } else {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid room or password' }));
        }
      } else if (data.type === 'message') {
        const { roomId, message } = data;

        if (chatRooms[roomId]) {
          chatRooms[roomId].clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'message',
                nickname: ws.nickname,
                message,
              }));
            }
          });
        }
      } else if (data.type === 'typing') {
        const { roomId, nickname } = data;

        if (chatRooms[roomId]) {
          chatRooms[roomId].clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'typing',
                nickname,
              }));
            }
          });
        }
      } else if (data.type === 'stop-typing') {
        const { roomId, nickname } = data;

        if (chatRooms[roomId]) {
          chatRooms[roomId].clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'stop-typing',
                nickname,
              }));
            }
          });
        }
      } else if (data.type === 'delete-room') {
        const { roomId } = data;

        if (chatRooms[roomId] && chatRooms[roomId].creator === ws.nickname) {
          chatRooms[roomId].clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'session-ended' }));
            }
          });

          delete chatRooms[roomId];
          saveRoomsToFile();
        } 
      }
    } catch (error) {
      console.error('Error processing message:', error.message);
      ws.send(JSON.stringify({ type: 'error', message: 'Internal server error' }));
    }
  });

  ws.on('close', () => {
    if (ws.roomId && chatRooms[ws.roomId]) {
      chatRooms[ws.roomId].clients = chatRooms[ws.roomId].clients.filter((client) => client !== ws);

      broadcastOnlineUsers(ws.roomId);
    }
  });
});

// Broadcast online users to all clients in the room
const broadcastOnlineUsers = (roomId) => {
  if (chatRooms[roomId]) {
    const onlineUsers = chatRooms[roomId].clients.map((client) => client.nickname);
    chatRooms[roomId].clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'online-users',
          users: onlineUsers,
        }));
      }
    });
  }
};

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
