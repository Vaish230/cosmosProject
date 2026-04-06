const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/databaseConfig");
const Message = require("./models/messageModel");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

connectDB();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoutes = require("./controllers/authController");
app.use("/api/auth", authRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

const connectedUsers = new Map();
const PROXIMITY_THRESHOLD = 70;

function calculateDistance(pos1, pos2) {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

const activeProximities = new Map();

function checkAndUpdateProximity() {
  const users = Array.from(connectedUsers.values());
  const currentProximities = new Map();

  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      const user1 = users[i];
      const user2 = users[j];

      const distance = calculateDistance(user1.position, user2.position);
      const pairKey = [user1.socketId, user2.socketId].sort().join(":");

      if (distance < PROXIMITY_THRESHOLD) {
        currentProximities.set(pairKey, { user1, user2 });

        if (!activeProximities.has(pairKey)) {
          console.log(`Proximity entered: ${user1.name} <-> ${user2.name}`);

          io.to(user1.socketId).emit("proximity:enter", {
            withUserId: user2.userId,
            withName: user2.name,
            withColor: user2.color,
            withSocketId: user2.socketId,
          });

          io.to(user2.socketId).emit("proximity:enter", {
            withUserId: user1.userId,
            withName: user1.name,
            withColor: user1.color,
            withSocketId: user1.socketId,
          });

          activeProximities.set(pairKey, { user1, user2 });
        }
      }
    }
  }

  for (const [pairKey, pair] of activeProximities.entries()) {
    if (!currentProximities.has(pairKey)) {
      console.log(`Proximity left: ${pair.user1.name} <-> ${pair.user2.name}`);

      io.to(pair.user1.socketId).emit("proximity:leave");
      io.to(pair.user2.socketId).emit("proximity:leave");

      activeProximities.delete(pairKey);
    }
  }
}

io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);

  socket.on("user:join", (userData) => {
    connectedUsers.set(socket.id, {
      socketId: socket.id,
      userId: userData.userId,
      name: userData.name,
      color: userData.color,
      position: { x: Math.random() * 800 + 200, y: Math.random() * 500 + 100 },
    });

    console.log(`${userData.name} joined the cosmos`);

    const allUsers = Array.from(connectedUsers.values()).map((user) => ({
      socketId: user.socketId,
      userId: user.userId,
      name: user.name,
      color: user.color,
      position: user.position,
    }));

    socket.emit("users:list", allUsers);

    socket.broadcast.emit("user:joined", {
      socketId: socket.id,
      userId: userData.userId,
      name: userData.name,
      color: userData.color,
      position: { x: 500, y: 400 },
    });

    setTimeout(() => checkAndUpdateProximity(), 100);
  });

  socket.on("user:move", (position) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      user.position = position;
      connectedUsers.set(socket.id, user);

      socket.broadcast.emit("user:moved", {
        socketId: socket.id,
        position: position,
      });

      checkAndUpdateProximity();
    }
  });

  // Handle chat message
  socket.on("chat:message", async (data) => {
    console.log("CHAT MESSAGE RECEIVED ON BACKEND:", data);
    const { toSocketId, message } = data;
    const fromUser = connectedUsers.get(socket.id);

    if (fromUser && message && message.trim()) {
      // Save to MongoDB
      const roomId = [fromUser.userId, fromUser.userId].sort().join(":");
      const chatMessage = new Message({
        roomId: roomId,
        fromUserId: fromUser.userId,
        toUserId: fromUser.userId,
        fromUserName: fromUser.name,
        fromUserColor: fromUser.color,
        message: message,
        timestamp: new Date(),
      });
      await chatMessage.save();

      io.to(toSocketId).emit("chat:message", {
        fromUserId: fromUser.userId,
        fromName: fromUser.name,
        fromColor: fromUser.color,
        message: message,
        timestamp: new Date().toISOString(),
      });

      socket.emit("chat:message", {
        fromUserId: fromUser.userId,
        fromName: fromUser.name,
        fromColor: fromUser.color,
        message: message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  socket.on("disconnect", () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      console.log(`${user.name} left the cosmos`);

      for (const [pairKey, pair] of activeProximities.entries()) {
        if (
          pair.user1.socketId === socket.id ||
          pair.user2.socketId === socket.id
        ) {
          activeProximities.delete(pairKey);
        }
      }

      io.emit("user:left", socket.id);
      connectedUsers.delete(socket.id);
    }
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || "Something went wrong" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket ready for connections`);
});
