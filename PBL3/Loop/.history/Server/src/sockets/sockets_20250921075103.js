export function registerSockets(io) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-room", ({ roomId }, cb) => {
      socket.join(roomId);
      cb?.({ ok: true, room: roomId });
    });

    socket.on("drawing", (data) => {
      socket.to(data.roomId).emit("drawing", data);
    });

    socket.on("begin-path", (data) => {
      socket.to(data.roomId).emit("begin-path", data);
    });

    socket.on("end-path", (data) => {
      socket.to(data.roomId).emit("end-path", data);
    });

    socket.on("shape", (data) => {
      socket.to(data.roomId).emit("shape", data);
    });

    socket.on("clear-canvas", ({ roomId }) => {
      socket.to(roomId).emit("clear-canvas");
    });

    socket.on("canvas-snapshot", ({ roomId, dataURL }) => {
      socket.to(roomId).emit("canvas-snapshot", { dataURL });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
}
