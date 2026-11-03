
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;

// Store connected users and their socket IDs
const onlineUsers = new Map();

// Read a specific cookie manually
const getCookie = (cookieHeader, name) => {
  const cookies = cookieHeader.split(";");

  for (const item of cookies) {
    const [key, ...value] = item.trim().split("=");

    if (key === name) {
      return decodeURIComponent(value.join("="));
    }
  }

  return null;
};

export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  // Authenticate socket connection using JWT
  io.use((socket, next) => {
    try {
      const token = getCookie(
        socket.handshake.headers.cookie || "",
        "connectly_token"
      );

      if (!token) {
        return next(new Error("Authentication cookie missing"));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      socket.userId = decoded.userId;

      console.log("Socket authenticated:", decoded.userId);

      next();
    } catch (error) {
      console.error("Socket JWT Error:", error.message);
      next(new Error("Unauthorized: Invalid token"));
    }
  });

  // Handle authenticated connections
  io.on("connection", (socket) => {
    const userId = socket.userId.toString();

    console.log("User connected:", userId);

    // Support multiple connections per user
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }

    onlineUsers.get(userId).add(socket.id);

    // Broadcast online users
    io.emit(
      "getOnlineUsers",
      Array.from(onlineUsers.keys())
    );

    // Handle user typing
    socket.on("typing", ({ receiverId, conversationId }) => {
      const receiverSockets = getReceiverSocketIds(receiverId);

      receiverSockets.forEach((socketId) => {
        io.to(socketId).emit("userTyping", {
          userId,
          conversationId,
        });
      });
    });

    // Handle user stopped typing
    socket.on("stopTyping", ({ receiverId, conversationId }) => {
      const receiverSockets = getReceiverSocketIds(receiverId);

      receiverSockets.forEach((socketId) => {
        io.to(socketId).emit("userStoppedTyping", {
          userId,
          conversationId,
        });
      });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      const userSockets = onlineUsers.get(userId);

      if (userSockets) {
        userSockets.delete(socket.id);

        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
        }
      }

      console.log("User disconnected:", userId);

      io.emit(
        "getOnlineUsers",
        Array.from(onlineUsers.keys())
      );
    });
  });

  return io;
};

// Get Socket.IO instance
export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO is not initialized");
  }

  return io;
};

// Get all socket IDs belonging to a receiver
export const getReceiverSocketIds = (userId) => {
  return onlineUsers.get(userId.toString()) || new Set();
};
