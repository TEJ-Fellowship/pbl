

io.on("connection", (socket) => {
    console.log("✅ Socket connected:", socket.id, "user:", socket.user?.id);

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
    });
  });