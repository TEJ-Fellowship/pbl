import express from "express";
import Poll from "../models/Poll.js";
import Vote from "../models/Vote.js";
import auth from "./middleware.js";

const router = express.Router();

// Get all polls + whether the user has voted in each
router.get("/", auth, async (req, res) => {
  try {
    const polls = await Poll.find({});

    // add `hasVoted` flag for frontend
    const pollsWithVoteStatus = await Promise.all(
      polls.map(async poll => {
        const vote = await Vote.findOne({
          pollId: poll._id,
          userId: req.user._id || req.user.id,
        });
        return {
          ...poll.toObject(),
          hasVoted: !!vote,
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


export default router;
