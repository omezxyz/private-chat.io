# Private Chat.io

**Private Chat.io** is a secure, private WebSocket-based chat application that enables users to create and join password-protected chat rooms for real-time, private conversations.

---

## Features

- Create password-protected chat rooms.
- Join existing rooms using Room ID and password.
- Real-time messaging with typing indicators.
- Displays online users in the room.
- Room creator can end the session for everyone.
- Supports sharing room links with embedded Room ID and password.
- Automatically handles reconnection.
- Privacy-focused: all communication happens via WebSocket.

---

## How to Use

### Creating a Room

1. Enter your nickname (optional; defaults to "Anonymous").
2. Enter a unique Room ID.
3. Enter a password to protect the room.
4. Click **Create Room**.
5. Share the Room ID and password with others so they can join.

### Joining a Room

1. Enter your nickname (optional; defaults to "Anonymous").
2. Enter the Room ID.
3. Enter the password.
4. Click **Join Room**.

### In the Chat

- Type your message and click **Send**.
- See other users typing in real-time.
- View the list of online users.
- If you are the room creator, you can click **End Session** to close the room for everyone.

---

## Notes

- Reloading or closing the page will remove you from the room.
- Room creators receive a warning when leaving, to prevent accidental session termination.
- Users joining via shared links (with Room ID and password in the URL) will **not** see a leave alert to improve user experience.

---

## Technical Details

- Frontend is a single HTML page with embedded JavaScript.
- Uses a WebSocket connection to `wss://private-chat-io.onrender.com`.
- Stores nickname, room ID, and creator status in `localStorage`.
- Handles reconnections automatically.
- Supports native sharing on supported browsers or copies room info to clipboard.

---

## Development & Deployment

- To run locally, serve the HTML file using any HTTP server.
- Ensure WebSocket server `wss://private-chat-io.onrender.com` is running and accessible.
- Customize styles and WebSocket URL as needed.

---

## License

This project is open-source and free to use.

---
