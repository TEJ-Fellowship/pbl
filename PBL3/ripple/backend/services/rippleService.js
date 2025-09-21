import Ripple from "../models/Ripple.js";
import { v4 as uuidv4 } from "uuid";

// , visibility = ["friends", "global"]

const createRipple = async (userId, visibility) => {
  const messages = [
    "Hello this is sad",
    "Hello, this is bad",
    "Hello, this is awesome!",
    "Namaste",
  ];

  const message = messages[Math.floor(Math.random() * messages.length)];

  const ripple = new Ripple({
    rippleId: uuidv4(),
    userId,
    message,
    visibility,
  });

  await ripple.save();
  return ripple;
};

const getFriendsRipple = async (friends) => {
  const ripples = await Ripple.find({
    userId: { $in: friends.map((friend) => friend._id) },
  })
    .sort({ createdAt: -1 })
    .limit(50);

  return ripples;
};
const getGlobalRipples = async () => {
  const ripples = await Ripple.find({
    visibility: "global",
  }).sort({ createdAt: -1 });
  return ripples;
};

export default { getFriendsRipple, getGlobalRipples, createRipple };
