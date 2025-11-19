import { io } from "socket.io-client";
const socket = io("http://localhost:3000"); // replace with your server URL

socket.on("connect", () => {
  console.log("Connected with socket ID:", socket.id);

  // Join a conversation
  const conversationId = "550e8400-e29b-41d4-a716-446655440000";
  socket.emit("conversation:join", conversationId);
  console.log("Joined conversation:", conversationId);

  // Send a message
  socket.emit("message:send", {
    conversationId: conversationId,
    senderId: "9a1cb83f-8fff-48ab-9d22-2095efc8e9c1",
    content: "Hello from test client!",
  });

  // Simulate typing
});

// Listen for server events
socket.on("message:receive", (msg) => console.log("Message received:", msg));
socket.on("typing:start", (userId) => console.log(userId, "started typing"));
socket.on("typing:stop", (userId) => console.log(userId, "stopped typing"));
