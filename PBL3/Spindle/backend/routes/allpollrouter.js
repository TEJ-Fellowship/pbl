import express from "express";
import Poll from "../models/poll.js";
import Vote from "../models/Vote.js";
import auth from "./middleware.js";
import User from "../models/user.js";
import userRouter from "./userRouter.js";

const router = express.Router();

// Get all polls
router.get("/", auth, async (req, res) => {
  try {
    const polls = await Poll.find({})
      .sort({ createdAt: -1 })
      .populate("user", "username"); // populate username only

    const pollsWithVoteStatus = await Promise.all(
      polls.map(async (poll) => {
        const vote = await Vote.findOne({
          pollId: poll._id,
          userId: req.user._id || req.user.id,
        });

        let status = "open";
        if (poll.expiresAt && new Date() >= new Date(poll.expiresAt)) {
          status = "closed";
        }

        return {
          ...poll.toObject(),
          hasVoted: !!vote,
          status,
        };
      })
    );

    res.json(pollsWithVoteStatus);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


// Cast one vote per poll per user
router.put("/:pollId/vote", auth, async (req, res) => {
  const { pollId } = req.params;
  const { optionId } = req.body;

  try {
    const poll = await Poll.findById(pollId);
    if (!poll) return res.status(404).json({ error: "Poll not found" });

    //block voting if poll is closed
    if (poll.expiresAt && new Date() >= new Date(poll.expiresAt)) {
      return res
        .status(400)
        .json({ error: "Poll is closed. Voting not allowed." });
    }

    const userId = req.user._id || req.user.id;

    // check if user already voted
    const existingVote = await Vote.findOne({ pollId, userId });
    if (existingVote) {
      return res.status(400).json({ error: "You already voted in this poll" });
    }

    // increment vote count directly in MongoDB
    const updatedPoll = await Poll.findOneAndUpdate(
      { _id: pollId, "options._id": optionId },
      { $inc: { "options.$.votes": 1 } },
      { new: true }
    );

    if (!updatedPoll) {
      return res.status(400).json({ error: "Option not found" });
    }

    // save user vote record
    const vote = new Vote({ pollId, userId, optionId });
    await vote.save();

    res.json({
      message: "Vote cast successfully",
      poll: updatedPoll,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

//get username and email
userRouter.get("/:id", auth, async (req, res) => {
  try {
    const userId = req.params.id;

    // Find user and return only username & email
    const user = await User.findById(userId).select("username email");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user); // returns {_id, username, email}
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

//get timer (not yet used, could add helper route later if needed)

export default router;
