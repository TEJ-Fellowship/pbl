import rippleService from "../services/rippleService.js";
import contactService from "../services/contactService.js";

export default function (io) {
  io.on("connection", (socket) => {
    console.log("socket id: ", socket.id);

    socket.on("join", (userId) => {
      socket.join(userId);
    });

    socket.on("sendRipple", async ({ userId }) => {
      const ripple = await rippleService.createRipple(userId);

      const globalMessage = `${userId} sends a ripple`;

      if (ripple.visibility.includes("global")) {
        io.emit("rippleNotification", {
          fromUser: userId,
          message: globalMessage,
        });
      }

      if (ripple.visibility.includes("friends")) {
        const friends = await contactService.getFriends(userId);

        friends.forEach((friend) => {
          io.to(friend._id.toString()).emit("sendRipple", {
            fromUser: userId,
            message: ripple.message,
          });
        });
        io.emit();
      }
    });

    socket.on("disconnect", () => {
      console.log("Disconnected", socket.id);
    });
  });
}
