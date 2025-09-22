import User from "../models/User.js";

class UserStatsService {
  // Update ripple sent count
  static async incrementRipplesSent(userId) {
    try {
      await User.findByIdAndUpdate(
        userId,
        { 
          $inc: { 
            'rippleStats.sent': 1,
            'rippleStats.wavesStarted': 1
          }
        },
        { upsert: false }
      );
    } catch (error) {
      console.error("Error incrementing ripples sent:", error);
    }
  }

  // Update ripple received count
  static async incrementRipplesReceived(userId) {
    try {
      await User.findByIdAndUpdate(
        userId,
        { 
          $inc: { 'rippleStats.received': 1 }
        },
        { upsert: false }
      );
    } catch (error) {
      console.error("Error incrementing ripples received:", error);
    }
  }

  // Update rippleback count
  static async incrementRipplebacks(userId) {
    try {
      await User.findByIdAndUpdate(
        userId,
        { 
          $inc: { 'rippleStats.totalRipplebacks': 1 }
        },
        { upsert: false }
      );
    } catch (error) {
      console.error("Error incrementing ripplebacks:", error);
    }
  }

  // Update user streak
  static async updateStreak(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastActivity = user.streak.lastActivity ? 
        new Date(user.streak.lastActivity.getFullYear(), user.streak.lastActivity.getMonth(), user.streak.lastActivity.getDate()) : 
        null;

      if (!lastActivity) {
        // First activity
        user.streak.current = 1;
        user.streak.longest = Math.max(user.streak.longest, 1);
      } else {
        const daysDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 0) {
          // Same day, don't change streak
          user.streak.lastActivity = now;
          await user.save();
          return;
        } else if (daysDiff === 1) {
          // Next day, increment streak
          user.streak.current += 1;
          user.streak.longest = Math.max(user.streak.longest, user.streak.current);
        } else {
          // Streak broken, reset to 1
          user.streak.current = 1;
        }
      }

      user.streak.lastActivity = now;
      await user.save();
    } catch (error) {
      console.error("Error updating streak:", error);
    }
  }

  // Get user stats
  static async getUserStats(userId) {
    try {
      const user = await User.findById(userId).select('streak rippleStats badges username');
      if (!user) return null;
      
      return {
        username: user.username,
        streak: user.streak || { current: 0, longest: 0 },
        rippleStats: user.rippleStats || { sent: 0, received: 0, wavesStarted: 0, totalRipplebacks: 0 },
        badges: user.badges || []
      };
    } catch (error) {
      console.error("Error getting user stats:", error);
      return null;
    }
  }
}

export default UserStatsService;