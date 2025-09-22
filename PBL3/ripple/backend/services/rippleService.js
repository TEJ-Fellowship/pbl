import Ripple from "../models/Ripple.js";
import UserStatsService from "./userStatsService.js";
import { v4 as uuidv4 } from "uuid";

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
  
  // Update user stats after successful ripple creation
  try {
    await UserStatsService.incrementRipplesSent(userId);
    await UserStatsService.updateStreak(userId);
  } catch (error) {
    console.error("Error updating user stats:", error);
    // Don't fail the ripple creation if stats update fails
  }
  
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

// New function to handle ripple back
const respondToRipple = async (rippleId, userId, type) => {
  try {
    // Find the ripple
    const ripple = await Ripple.findOne({ rippleId });
    if (!ripple) {
      throw new Error("Ripple not found");
    }

    // Check if user already responded to this ripple
    const existingResponse = ripple.responses.find(
      response => response.userId.toString() === userId.toString()
    );

    if (existingResponse) {
      throw new Error("You have already responded to this ripple");
    }

    // Add the response
    ripple.responses.push({
      userId,
      type,
      timestamp: new Date()
    });

    await ripple.save();

    // Update stats for both users
    try {
      // Increment ripple back count for the original ripple creator
      await UserStatsService.incrementRipplebacks(ripple.userId);
      
      // Increment ripples received count for the person responding
      await UserStatsService.incrementRipplesReceived(userId);
      
      // Update streak for the person responding
      await UserStatsService.updateStreak(userId);
    } catch (error) {
      console.error("Error updating user stats:", error);
    }

    return {
      message: "Response added successfully",
      ripple: ripple,
      responseCount: ripple.responses.length
    };
  } catch (error) {
    throw error;
  }
};

export default { getFriendsRipple, getGlobalRipples, createRipple, respondToRipple };