import { Friend } from "../models/Friend.js";
import { User } from "../models/User.js";

// Get all users (for friend search)
export const getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    
    // Get all users except current user
    const users = await User.find(
      { _id: { $ne: currentUserId } },
      { username: 1, email: 1, profilePic: 1, bio: 1 }
    );

    // Get friend relationships for current user
    const friendships = await Friend.find({
      $or: [
        { requester: currentUserId },
        { recipient: currentUserId }
      ]
    });

    // Map users with their friendship status
    const usersWithStatus = users.map(user => {
      const friendship = friendships.find(f => 
        (f.requester.toString() === currentUserId && f.recipient.toString() === user._id.toString()) ||
        (f.recipient.toString() === currentUserId && f.requester.toString() === user._id.toString())
      );

      let status = "none";
      if (friendship) {
        if (friendship.status === "accepted") {
          status = "friends";
        } else if (friendship.requester.toString() === currentUserId) {
          status = "sent";
        } else {
          status = "received";
        }
      }

      return {
        ...user.toObject(),
        friendshipStatus: status
      };
    });

    res.status(200).json(usersWithStatus);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
};

// Send friend request
export const sendFriendRequest = async (req, res) => {
  try {
    const requesterId = req.user.id;
    const { recipientId } = req.body;

    if (requesterId === recipientId) {
      return res.status(400).json({ message: "Cannot send friend request to yourself" });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if friendship already exists
    const existingFriendship = await Friend.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId }
      ]
    });

    if (existingFriendship) {
      return res.status(409).json({ message: "Friend request already exists" });
    }

    // Create new friend request
    const friendRequest = new Friend({
      requester: requesterId,
      recipient: recipientId,
    });

    await friendRequest.save();

    res.status(201).json({
      message: "Friend request sent successfully",
      friendRequest
    });
  } catch (error) {
    console.error("Error sending friend request:", error);
    res.status(500).json({ message: "Failed to send friend request", error: error.message });
  }
};

// Respond to friend request
export const respondToFriendRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId, action } = req.body; // action: 'accept' or 'reject'

    const friendRequest = await Friend.findById(requestId);
    
    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (friendRequest.recipient.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to respond to this request" });
    }

    friendRequest.status = action === 'accept' ? 'accepted' : 'rejected';
    friendRequest.updatedAt = new Date();
    
    await friendRequest.save();

    res.status(200).json({
      message: `Friend request ${action}ed successfully`,
      friendRequest
    });
  } catch (error) {
    console.error("Error responding to friend request:", error);
    res.status(500).json({ message: "Failed to respond to friend request", error: error.message });
  }
};

// Get friend requests
export const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const friendRequests = await Friend.find({
      recipient: userId,
      status: "pending"
    }).populate("requester", "username email profilePic");

    res.status(200).json(friendRequests);
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    res.status(500).json({ message: "Failed to fetch friend requests", error: error.message });
  }
};

// Get friends list
export const getFriends = async (req, res) => {
  try {
    const userId = req.user.id;

    const friendships = await Friend.find({
      $or: [
        { requester: userId, status: "accepted" },
        { recipient: userId, status: "accepted" }
      ]
    }).populate("requester recipient", "username email profilePic");

    const friends = friendships.map(friendship => {
      const friend = friendship.requester._id.toString() === userId 
        ? friendship.recipient 
        : friendship.requester;
      return friend;
    });

    res.status(200).json(friends);
  } catch (error) {
    console.error("Error fetching friends:", error);
    res.status(500).json({ message: "Failed to fetch friends", error: error.message });
  }
};