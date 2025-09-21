// import rippleService from "../services/rippleService.js";
// import contactService from "../services/contactService.js";
// import JWTUtils from "../utils/jwt.js";
// import Notification from "../models/Notification.js";

// const onlineUsers = new Map();

// export default function (io) {
//   io.use((socket, next) => {
//     try {
//       const cookies = socket.handshake.headers.cookie;
//       const token = cookies?.split("accessToken=")[1];

//       if (!token) return next(new Error("Authentication Error"));
//       const decoded = JWTUtils.verifyAccessToken(token);
//       socket.userId = decoded.userId;
//       socket.username = decoded.username;
//       next();
//     } catch (error) {
//       next(new Error("Invalid token"));
//     }
//   });

//   io.on("connection", (socket) => {
//     console.log("socket id: ", socket.id);
//     const { userId, username } = socket;

//     console.log(userId, socket.id);

//     onlineUsers.set(userId, socket.id);

//     socket.on("updateLocation", async (locationData) => {
//       try {
//         await User.findByIdAndUpdate(userId, {
//           location: {
//             latitude: locationData.latitude,
//             longitude: locationData.longitude,
//             address: locationData.address,
//             city: locationData.city,
//             country: locationData.country,
//             updatedAt: new Date(),
//           },
//         });

//         console.log(
//           `Location updated for user ${username}: ${locationData.city}, ${locationData.country}`
//         );
//       } catch (error) {
//         console.error("Error updating location:", error.message);
//       }
//     });

//     socket.on("sendRipple", async ({ visibility }) => {
//       try {
//         const ripple = await rippleService.createRipple(userId, visibility);
//         console.log(ripple);
//         const globalMessage = ` sends a ripple`;
//         if (ripple.visibility.includes("global")) {
//           //save to notification db
//           await Notification.create({
//             userId: null,
//             fromUserId: userId,
//             fromUsername: username,
//             rippleId: ripple.rippleId.toString(),
//             type: "global_ripple",
//             message: globalMessage,
//             createdAt: new Date(),
//           });
//           io.emit("rippleNotification", {
//             userId: null,
//             fromUserId: userId,
//             fromUsername: username,
//             rippleId: ripple.rippleId.toString(),
//             type: "global_ripple",
//             message: globalMessage,
//             createdAt: new Date(),
//           });
//         }

//         if (ripple.visibility.includes("friends")) {
//           const friends = await contactService.listContacts(userId);
//           console.log(friends);
//           await Promise.all(
//             friends.map(async (friend) => {
//               try {
//                 await Notification.create({
//                   userId: friend._id,
//                   fromUserId: userId,
//                   fromUsername: username,
//                   rippleId: ripple.rippleId.toString(),
//                   type: "friend_ripple",
//                   message: ripple.message,
//                   createdAt: new Date(),
//                 });

//                 const friendSocketId = onlineUsers.get(friend._id.toString());
//                 console.log(friendSocketId + "   ddsdsds");
//                 io.to(friendSocketId).emit("sendRippleFriends", {
//                   userId: friend._id,
//                   fromUserId: userId,
//                   fromUsername: username,
//                   rippleId: ripple.rippleId.toString(),
//                   type: "friend_ripple",
//                   message: ripple.message,
//                   createdAt: new Date(),
//                 });
//               } catch (error) {
//                 console.log(`failed for friend ${friend._id}`, error.message);
//               }
//             })
//           );
//         }
//       } catch (error) {
//         console.error("Error sending ripple: ", error.message);
//       }
//     });

//     socket.on("disconnect", (reason) => {
//       console.log("Disconnected", socket.id, "reason", reason);
//     });
//   });
// }

import rippleService from "../services/rippleService.js";
import contactService from "../services/contactService.js";
import JWTUtils from "../utils/jwt.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js"; // Add this import

const onlineUsers = new Map(); // userId -> { socketId, username, location, isVisible }

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

  // Broadcast connected users with locations to all clients
  const broadcastConnectedUsers = () => {
    const usersWithLocations = Array.from(onlineUsers.entries())
      .filter(([userId, userData]) => userData.location && userData.isVisible)
      .map(([userId, userData]) => ({
        userId,
        username: userData.username,
        location: userData.location,
        isIPLocation: userData.location.isIPLocation,
      }));

    io.emit("usersLocationUpdate", usersWithLocations);
  };

  io.on("connection", (socket) => {
    console.log("socket id: ", socket.id);
    const { userId, username } = socket;
    console.log(userId, socket.id);

    // Add user to online users map
    onlineUsers.set(userId, {
      socketId: socket.id,
      username: username,
      location: null,
      isVisible: true,
    });

    // Send current connected users to the new client
    socket.on("getConnectedUsers", () => {
      broadcastConnectedUsers();
    });

    // Handle location updates
    socket.on("updateLocation", async (locationData) => {
      try {
        // Update database
        await User.findByIdAndUpdate(userId, {
          location: {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            address: locationData.address,
            city: locationData.city,
            country: locationData.country,
            updatedAt: new Date(),
            isIPLocation: locationData.isIPLocation || false,
          },
        });

        // Update in-memory location for this user
        if (onlineUsers.has(userId)) {
          onlineUsers.get(userId).location = locationData;
        }

        console.log(
          `Location updated for user ${username}: ${locationData.city}, ${locationData.country}`
        );

        // Broadcast updated user locations to all clients
        broadcastConnectedUsers();
      } catch (error) {
        console.error("Error updating location:", error.message);
      }
    });

    // Handle location visibility toggle
    socket.on("toggleLocationVisibility", (isVisible) => {
      if (onlineUsers.has(userId)) {
        onlineUsers.get(userId).isVisible = isVisible;
        broadcastConnectedUsers();
        console.log(
          `User ${username} ${
            isVisible ? "enabled" : "disabled"
          } location sharing`
        );
      }
    });

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

                const friendSocketId = onlineUsers.get(
                  friend._id.toString()
                )?.socketId;
                console.log(friendSocketId + " ddsdsds");

                if (friendSocketId) {
                  io.to(friendSocketId).emit("sendRippleFriends", {
                    userId: friend._id,
                    fromUserId: userId,
                    fromUsername: username,
                    rippleId: ripple.rippleId.toString(),
                    type: "friend_ripple",
                    message: ripple.message,
                    createdAt: new Date(),
                  });
                }
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
      // Remove user from online users when they disconnect
      onlineUsers.delete(userId);
      // Broadcast updated user list
      broadcastConnectedUsers();
    });
  });
}
