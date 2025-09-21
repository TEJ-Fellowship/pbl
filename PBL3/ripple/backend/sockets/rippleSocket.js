import rippleService from "../services/rippleService.js";
import contactService from "../services/contactService.js";
import JWTUtils from "../utils/jwt.js";

const onlineUsers = new Map();

export default function (io) {
  io.use((socket, next) => {
    try {
      const cookies = socket.handshake.headers.cookie;
      const token = cookies?.split("accessToken=")[1];

      if (!token) return next(new Error("Authentication Error"));
      const decoded = JWTUtils.verifyAccessToken(token);
      socket.userId = decoded.userId;
      socket.username = decoded.username;
      next();
    } catch (error) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("socket id: ", socket.id);

    socket.on("sendRipple", async ({ visibility }) => {
      try {
        const { userId, username } = socket;

        console.log(userId, socket.id);
        onlineUsers.set(userId, socket.id);

        const ripple = await rippleService.createRipple(userId, visibility);
        const globalMessage = ` sends a ripple`;
        if (ripple.visibility.includes("global")) {
          io.emit("rippleNotification", {
            id: userId,
            fromUser: username,
            message: globalMessage,
          });
        }

        if (ripple.visibility.includes("friends")) {
          const friends = await contactService.listContacts(userId);
          console.log(friends);
          friends.forEach((friend) => {
            const friendSocketId = onlineUsers.get(friend._id.toString());
            console.log(friendSocketId);
            io.to(friendSocketId).emit("sendRippleFriends", {
              id: userId,
              fromUser: username,
              message: ripple.message,
            });
          });
        }
      } catch (error) {
        console.error("Error sending ripple: ", error.message);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("Disconnected", socket.id, "reason", reason);
    });
  });
}
