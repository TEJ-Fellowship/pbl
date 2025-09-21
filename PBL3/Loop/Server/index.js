// Fixed backend index.js with improved error handling and consistency
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server as IOServer } from "socket.io";

import { connectDB } from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import roomRoutes from "./src/routes/roomRoutes.js";
import loopRoutes from "./src/routes/loopRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import drawingRoutes from "./src/routes/drawingRoutes.js";

dotenv.config({ path: "./src/.env" });
connectDB();

const app = express();
const server = http.createServer(app);
const io = new IOServer(server, {
  cors: { 
    origin: ["http://localhost:5173", "http://localhost:3000"], 
    credentials: true 
  },
  transports: ['websocket', 'polling']
});

// Middleware
app.use(cors({ 
  origin: ["http://localhost:5173", "http://localhost:3000"], 
  credentials: true 
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/loop", loopRoutes);
app.use("/api/userRoutes", userRoutes);
app.use("/api/drawings", drawingRoutes);

app.get("/", (req, res) => res.json({ 
  ok: true, 
  message: "Doodle Together Backend API",
  timestamp: new Date().toISOString(),
  version: "1.0.0"
}));

// ------------------- Socket.IO Room Management -------------------
const rooms = {}; 
// Structure: rooms[roomId] = { 
//   users: [{socketId, userId, username, avatar}], 
//   currentIndex: 0, 
//   timer: 30, 
//   interval: null,
//   isTimerActive: false
// }

io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Join Room Event - FIXED: Better error handling
  socket.on("joinRoom", ({ roomId, userId, username, avatar }) => {
    console.log(`👤 Join request - Room: ${roomId}, User: ${username} (${userId})`);
    
    // Input validation
    if (!roomId || !userId) {
      console.log("❌ Missing roomId or userId");
      socket.emit("error", { message: "Missing roomId or userId" });
      return;
    }

    if (!username) {
      username = `User${userId.slice(-4)}`;
      console.log(`⚠️ No username provided, using default: ${username}`);
    }
    
    try {
      // Join the socket room
      socket.join(roomId);
      
      // Initialize room if it doesn't exist
      if (!rooms[roomId]) {
        rooms[roomId] = { 
          users: [], 
          currentIndex: 0, 
          timer: 30,
          interval: null,
          isTimerActive: false
        };
        console.log(`🏠 Created new room: ${roomId}`);
      }

      // Remove any existing entry for this user (handle reconnections)
      rooms[roomId].users = rooms[roomId].users.filter(u => u.userId !== userId);
      
      // Add user to room
      const newUser = { 
        socketId: socket.id, 
        userId, 
        username, 
        avatar: avatar || null,
        joinedAt: new Date()
      };
      
      rooms[roomId].users.push(newUser);
      
      console.log(`✅ User ${username} joined room ${roomId}. Total users: ${rooms[roomId].users.length}`);

      // Broadcast updated user list to all users in room
      const userList = rooms[roomId].users.map(u => ({
        userId: u.userId,
        username: u.username,
        avatar: u.avatar,
        isOnline: true
      }));
      
      io.to(roomId).emit("roomUsers", userList);

      // Handle turn management
      if (rooms[roomId].users.length === 1) {
        // First user - they get the turn immediately, no timer
        rooms[roomId].currentIndex = 0;
        rooms[roomId].isTimerActive = false;
        
        io.to(roomId).emit("turn:started", {
          userId: newUser.userId,
          username: newUser.username,
          duration: 30
        });
        
        console.log(`🎨 ${username} is the first user, gets unlimited drawing time`);
        
      } else if (rooms[roomId].users.length >= 2 && !rooms[roomId].isTimerActive) {
        // Second user joined - start the timer system
        console.log(`⏰ Starting timer system for room ${roomId}`);
        startTurn(roomId);
        
      } else {
        // User joining ongoing session - send current turn info
        const currentUser = rooms[roomId].users[rooms[roomId].currentIndex % rooms[roomId].users.length];
        if (currentUser) {
          socket.emit("turn:started", {
            userId: currentUser.userId,
            username: currentUser.username,
            duration: rooms[roomId].timer
          });
        }
      }

      // Send welcome message to the user
      socket.emit("welcomeMessage", {
        message: `Welcome to room ${roomId}!`,
        roomInfo: {
          totalUsers: rooms[roomId].users.length,
          isTimerActive: rooms[roomId].isTimerActive
        }
      });

    } catch (error) {
      console.error(`❌ Error joining room ${roomId}:`, error);
      socket.emit("error", { message: "Failed to join room" });
    }
  });

  // Leave Room Event
  socket.on("leaveRoom", ({ roomId, userId }) => {
    try {
      handleUserLeave(roomId, userId, socket);
    } catch (error) {
      console.error(`❌ Error leaving room ${roomId}:`, error);
    }
  });

  // Drawing Events - FIXED: Better validation
  socket.on("stroke:new", (payload) => {
    try {
      if (!payload?.roomId) {
        console.log("❌ Invalid stroke payload - missing roomId");
        socket.emit("error", { message: "Invalid stroke data" });
        return;
      }
      
      // Validate required stroke properties
      const requiredProps = ['tool', 'color', 'size'];
      const missingProps = requiredProps.filter(prop => !payload[prop]);
      
      if (missingProps.length > 0) {
        console.log(`❌ Invalid stroke payload - missing: ${missingProps.join(', ')}`);
        socket.emit("error", { message: `Missing stroke properties: ${missingProps.join(', ')}` });
        return;
      }
      
      console.log(`🖌️ Broadcasting new stroke to room ${payload.roomId}`);
      socket.to(payload.roomId).emit("stroke:created", payload);
    } catch (error) {
      console.error("❌ Error handling new stroke:", error);
      socket.emit("error", { message: "Failed to process stroke" });
    }
  });

  socket.on("stroke:delete", ({ roomId, strokeId }) => {
    try {
      if (!roomId || !strokeId) {
        console.log("❌ Invalid delete payload - missing roomId or strokeId");
        socket.emit("error", { message: "Invalid delete data" });
        return;
      }
      
      console.log(`🗑️ Broadcasting stroke deletion to room ${roomId}`);
      socket.to(roomId).emit("stroke:deleted", { strokeId });
    } catch (error) {
      console.error("❌ Error handling stroke deletion:", error);
      socket.emit("error", { message: "Failed to delete stroke" });
    }
  });

  // Cursor tracking
  socket.on("cursor:update", (payload) => {
    try {
      if (!payload?.roomId || typeof payload.x !== 'number' || typeof payload.y !== 'number') {
        return; // Silently ignore invalid cursor data
      }
      
      socket.to(payload.roomId).emit("cursor:updated", {
        userId: payload.userId,
        username: payload.username,
        x: payload.x,
        y: payload.y,
        color: payload.color || "#000000"
      });
    } catch (error) {
      console.error("❌ Error handling cursor update:", error);
    }
  });

  // Handle disconnection
  socket.on("disconnect", (reason) => {
    console.log(`🔌 Socket disconnected: ${socket.id} - Reason: ${reason}`);
    
    try {
      // Find and remove user from all rooms
      for (const roomId in rooms) {
        const userIndex = rooms[roomId].users.findIndex(u => u.socketId === socket.id);
        if (userIndex !== -1) {
          const user = rooms[roomId].users[userIndex];
          console.log(`👋 Removing ${user.username} from room ${roomId} due to disconnect`);
          handleUserLeave(roomId, user.userId, null, true);
          break; // User can only be in one room at a time
        }
      }
    } catch (error) {
      console.error("❌ Error handling disconnect:", error);
    }
  });

  // Error handling
  socket.on("error", (error) => {
    console.error(`❌ Socket error for ${socket.id}:`, error);
  });
});

// ------------------- Helper Functions -------------------

function handleUserLeave(roomId, userId, socket = null, isDisconnect = false) {
  if (!rooms[roomId]) return;
  
  const userIndex = rooms[roomId].users.findIndex(u => u.userId === userId);
  if (userIndex === -1) return;

  const leavingUser = rooms[roomId].users[userIndex];
  const wasCurrentDrawer = rooms[roomId].currentIndex === userIndex;
  
  console.log(`👋 ${leavingUser.username} leaving room ${roomId} (disconnect: ${isDisconnect})`);

  // Remove user from room
  rooms[roomId].users.splice(userIndex, 1);
  
  // Adjust currentIndex if necessary
  if (userIndex < rooms[roomId].currentIndex) {
    rooms[roomId].currentIndex--;
  } else if (wasCurrentDrawer && rooms[roomId].users.length > 0) {
    // Current drawer left, adjust index to stay within bounds
    rooms[roomId].currentIndex = rooms[roomId].currentIndex % rooms[roomId].users.length;
  }

  // Broadcast updated user list
  const userList = rooms[roomId].users.map(u => ({
    userId: u.userId,
    username: u.username,
    avatar: u.avatar,
    isOnline: true
  }));
  
  io.to(roomId).emit("roomUsers", userList);

  // Handle room cleanup or turn management
  if (rooms[roomId].users.length === 0) {
    // Empty room - clean up
    console.log(`🧹 Cleaning up empty room ${roomId}`);
    if (rooms[roomId].interval) {
      clearInterval(rooms[roomId].interval);
    }
    delete rooms[roomId];
    
  } else if (rooms[roomId].users.length === 1) {
    // Only one user left - stop timer, give them unlimited time
    console.log(`⏰ Only one user left in room ${roomId}, stopping timer`);
    
    if (rooms[roomId].interval) {
      clearInterval(rooms[roomId].interval);
    }
    
    rooms[roomId].isTimerActive = false;
    rooms[roomId].currentIndex = 0;
    rooms[roomId].timer = 30;
    
    const remainingUser = rooms[roomId].users[0];
    io.to(roomId).emit("turn:started", {
      userId: remainingUser.userId,
      username: remainingUser.username,
      duration: 30
    });
    
  } else if (wasCurrentDrawer) {
    // Current drawer left with multiple users remaining - start next turn
    console.log(`🔄 Current drawer left, starting next turn in room ${roomId}`);
    startTurn(roomId);
  }
}

function startTurn(roomId) {
  const room = rooms[roomId];
  if (!room || room.users.length === 0) {
    console.log(`❌ Cannot start turn: room ${roomId} not found or empty`);
    return;
  }

  // Clear any existing interval
  if (room.interval) {
    clearInterval(room.interval);
  }

  // Ensure currentIndex is valid
  if (room.currentIndex >= room.users.length) {
    room.currentIndex = 0;
  }

  const currentUser = room.users[room.currentIndex];
  if (!currentUser) {
    console.log(`❌ No current user found for room ${roomId}`);
    return;
  }

  room.timer = 30;
  room.isTimerActive = room.users.length > 1; // Only activate timer with multiple users

  console.log(`🎨 Starting turn: ${currentUser.username} in room ${roomId} (${room.users.length} users, timer: ${room.isTimerActive})`);

  // Notify all users about the new turn
  io.to(roomId).emit("turn:started", { 
    userId: currentUser.userId, 
    username: currentUser.username, 
    avatar: currentUser.avatar,
    duration: room.timer 
  });

  // Start countdown timer (only with multiple users)
  if (room.isTimerActive) {
    room.interval = setInterval(() => {
      room.timer--;
      
      // Broadcast timer update
      io.to(roomId).emit("turn:update", { remaining: room.timer });

      if (room.timer <= 0) {
        console.log(`⏰ Turn ended for ${currentUser.username} in room ${roomId}`);
        
        // Clear interval
        clearInterval(room.interval);
        
        // Move to next user
        room.currentIndex = (room.currentIndex + 1) % room.users.length;
        
        const nextUser = room.users[room.currentIndex];
        
        if (nextUser) {
          // Notify about turn transition
          io.to(roomId).emit("turn:ended", { 
            previousUserId: currentUser.userId,
            nextUserId: nextUser.userId,
            nextUsername: nextUser.username 
          });
          
          // Start next turn after brief delay
          setTimeout(() => {
            startTurn(roomId);
          }, 1000);
        } else {
          // Fallback: restart with first user
          room.currentIndex = 0;
          setTimeout(() => {
            startTurn(roomId);
          }, 1000);
        }
      }
    }, 1000);
  } else {
    console.log(`📝 Single user mode: ${currentUser.username} has unlimited time`);
  }
}

// ------------------- Debug & Monitoring -------------------

// Debug endpoint to monitor rooms
app.get("/debug/rooms", (req, res) => {
  const roomsInfo = {};
  
  for (const roomId in rooms) {
    const room = rooms[roomId];
    roomsInfo[roomId] = {
      userCount: room.users.length,
      users: room.users.map(u => ({
        username: u.username,
        userId: u.userId,
        socketId: u.socketId,
        joinedAt: u.joinedAt
      })),
      currentDrawer: room.users[room.currentIndex]?.username || 'None',
      currentIndex: room.currentIndex,
      timer: room.timer,
      isTimerActive: room.isTimerActive,
      hasInterval: !!room.interval
    };
  }
  
  res.json({
    totalRooms: Object.keys(rooms).length,
    rooms: roomsInfo,
    serverTime: new Date().toISOString()
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    activeRooms: Object.keys(rooms).length,
    totalConnectedUsers: Object.values(rooms).reduce((total, room) => total + room.users.length, 0)
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Express error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Set io instance for use in routes
app.set("io", io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Debug endpoint: http://localhost:${PORT}/debug/rooms`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
});