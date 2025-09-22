import rippleService from "../services/rippleService.js";
import contactService from "../services/contactService.js";
import JWTUtils from "../utils/jwt.js";
import Notification from "../models/Notification.js";

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
    const { userId, username } = socket;

    console.log(userId, socket.id);

    onlineUsers.set(userId, socket.id);

    socket.on("sendRipple", async ({ visibility }) => {
      try {
        const ripple = await rippleService.createRipple(userId, visibility);
        console.log(ripple);
        const globalMessage = ` sends a ripple`;
        if (ripple.visibility.includes("global")) {
          //save to notification db
          await Notification.create({
            userId: null,
            fromUserId: userId,
            fromUsername: username,
            rippleId: ripple.rippleId.toString(),
            type: "global_ripple",
            message: globalMessage,
            createdAt: new Date(),
          });
          io.emit("rippleNotification", {
            userId: null,
            fromUserId: userId,
            fromUsername: username,
            rippleId: ripple.rippleId.toString(),
            type: "global_ripple",
            message: globalMessage,
            createdAt: new Date(),
          });
        }

        if (ripple.visibility.includes("friends")) {
          const friends = await contactService.listContacts(userId);
          console.log(friends);
          await Promise.all(
            friends.map(async (friend) => {
              try {
                await Notification.create({
                  userId: friend._id,
                  fromUserId: userId,
                  fromUsername: username,
                  rippleId: ripple.rippleId.toString(),
                  type: "friend_ripple",
                  message: ripple.message,
                  createdAt: new Date(),
                });

                const friendSocketId = onlineUsers.get(friend._id.toString());
                console.log(friendSocketId + "   ddsdsds");
                io.to(friendSocketId).emit("sendRippleFriends", {
                  userId: friend._id,
                  fromUserId: userId,
                  fromUsername: username,
                  rippleId: ripple.rippleId.toString(),
                  type: "friend_ripple",
                  message: ripple.message,
                  createdAt: new Date(),
                });
              } catch (error) {
                console.log(`failed for friend ${friend._id}`, error.message);
              }
            })
          );
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
