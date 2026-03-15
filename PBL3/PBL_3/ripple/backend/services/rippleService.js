import Ripple from "../models/Ripple.js";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

// , visibility = ["friends", "global"]

const createRipple = async (userId, visibility) => {
  const messages = [
    "Hey , just wanted to let you know you crossed my mind today. Hope you're having a good week!",
    "Thinking of you, Sending you some good vibes and a big hug!",
    "Hi, It's been a while, but I was just thinking of our old adventures and it made me smile. Miss you!",
    "Hey just a random thought: you're one of the best people I know. Hope you're doing well!",
    "Checking in on you,I know things have been tough, and I want you to know I'm here for you.",
    "Hey. thinking about all the fun we've had and can't wait to make more memories soon!",
    "Just a quick note to say hi, Hope your day is as awesome as you are!",
    "Hey, I know we haven't talked in a bit, but you popped into my head and I wanted to reach out. Hope you're doing okay.",
    "Thinking of you, Hope you're having a cozy and relaxing day.",
    "Hi! You've been on my mind. Just wanted to send a little love your way.",
    "Just saw something that reminded me of you, Hope you're doing great!",
    "Hey, I'm grateful for our friendship. Thinking of you today.",
    "Just wanted to say that you're an amazing person, Hope your day is wonderful!",
    "Thinking of you, and sending strength your way. I'm rooting for you!",
    "Hey, I was just thinking of you and wanted to send a quick message to brighten your day!",
    "Hi, Hope you're taking care of yourself. Thinking of you and sending good vibes.",
    "Just a reminder that you're a wonderful friend, Thinking of you!",
    "Hey, thinking of you today and missing our chats. Let's catch up soon!",
    "Hey, just wanted to say you've been on my mind. Hope everything is going well!",
    "Thinking of you, and all the good times we've shared. So glad you're in my life!",
  ];

  const message = messages[Math.floor(Math.random() * messages.length)];

  const ripple = new Ripple({
    rippleId: uuidv4(),
    userId,
    message,
    visibility,
    sentiment: "pending",
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

  return ripples.map((r) => ({
    ...r,
    sentiment: r.sentiment || "pending", // default if sentiment not yet analyzed
  }));
};
const getGlobalRipples = async () => {
  const ripples = await Ripple.find({
    visibility: "global",
  }).sort({ createdAt: -1 });
  return ripples;
};

const updateRippleSentiment = async (rippleId, sentiment) => {
  try {
    // // Validate sentiment value
    // const allowed = ["positive", "neutral", "negative"];
    // if (!allowed.includes(sentiment)) {
    //   throw new Error("Invalid sentiment value");
    // }

    const ripple = await Ripple.findByIdAndUpdate(
      rippleId,
      { sentiment },
      { new: true } // return the updated document
    );

    if (!ripple) throw new Error("Ripple not found");

    console.log(`Sentiment updated for Ripple ${rippleId}: ${sentiment}`);
    return ripple;
  } catch (error) {
    console.error("Error updating ripple sentiment:", error.message);
    throw error;
  }
};

export default {
  getFriendsRipple,
  getGlobalRipples,
  createRipple,
  updateRippleSentiment,
};
