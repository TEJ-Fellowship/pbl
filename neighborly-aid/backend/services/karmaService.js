const mongoose = require("mongoose");
const User = require("../models/User");

class KarmaService {
  // Transfer karma points from requester to helper when task is completed
  async transferKarmaPoints(taskId, requesterId, helperId, karmaAmount) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Validate input parameters
      if (!taskId || !requesterId || !helperId || !karmaAmount) {
        throw new Error("Missing required parameters for karma transfer");
      }

      if (karmaAmount <= 0) {
        throw new Error("Karma amount must be positive");
      }

      // Validate users exist
      const requester = await User.findById(requesterId).session(session);
      const helper = await User.findById(helperId).session(session);

      if (!requester) {
        throw new Error("Requester not found");
      }

      if (!helper) {
        throw new Error("Helper not found");
      }

      // Prevent self-transfer
      if (requesterId === helperId) {
        throw new Error("Cannot transfer karma to yourself");
      }

      // Check if requester has enough karma points (karma was already reserved during task creation)
      if (requester.karmaPoints < karmaAmount) {
        throw new Error(
          `Requester doesn't have enough karma points. Total: ${requester.karmaPoints}, Required: ${karmaAmount}`
        );
      }

      // Transfer karma points from requester to helper (karma was already reserved)
      const updatedRequester = await User.findByIdAndUpdate(
        requesterId,
        { $inc: { karmaPoints: -karmaAmount } },
        { new: true, session }
      );

      // Add karma points to helper
      const updatedHelper = await User.findByIdAndUpdate(
        helperId,
        { $inc: { karmaPoints: karmaAmount } },
        { new: true, session }
      );

      // Commit the transaction
      await session.commitTransaction();

      console.log(
        `Karma transfer successful: ${karmaAmount} points from ${requester.name} to ${helper.name}`
      );

      return {
        requester: updatedRequester,
        helper: updatedHelper,
        transferredAmount: karmaAmount,
        taskId,
      };
    } catch (error) {
      // Rollback the transaction on error
      await session.abortTransaction();
      console.error("Karma transfer failed:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Get karma points for a user
  async getUserKarmaPoints(userId) {
    try {
      const user = await User.findById(userId).select("karmaPoints name");
      if (!user) {
        throw new Error("User not found");
      }
      return {
        userId: user._id,
        name: user.name,
        karmaPoints: user.karmaPoints,
      };
    } catch (error) {
      throw error;
    }
  }

  // Update user karma points (for other operations)
  async updateUserKarmaPoints(userId, amount) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $inc: { karmaPoints: amount } },
        { new: true }
      ).select("karmaPoints name");

      if (!user) {
        throw new Error("User not found");
      }

      return {
        userId: user._id,
        name: user.name,
        karmaPoints: user.karmaPoints,
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new KarmaService();
