import express from "express";
import Poll from "../models/Poll.js";
import Vote from "../models/Vote.js";
import auth from "./middleware.js";

const router = express.Router();

// ✅ Get all polls + whether the user has voted in each
router.get("/", auth, async (req, res) => {
  try {
    const polls = await Poll.find({}).populate("createdBy", "username");

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

// ✅ Cast one vote per poll per user
router.post("/:pollId/vote", auth, async (req, res) => {
  const { pollId } = req.params;
  const { optionId } = req.body;

  try {
    const poll = await Poll.findById(pollId);
    if (!poll) return res.status(404).json({ error: "Poll not found" });

    const userId = req.user._id || req.user.id;

    // Check if already voted in this poll
    const existingVote = await Vote.findOne({ pollId, userId });
    if (existingVote) {
      return res.status(400).json({ error: "You already voted in this poll" });
    }

    // Save vote
    const vote = new Vote({ pollId, userId, optionId });
    await vote.save();

    // Update poll option count
    const option = poll.options.id(optionId);
    if (!option) return res.status(400).json({ error: "Option not found" });

    option.votes += 1;
    await poll.save();

    res.json({ message: "Vote cast successfully", poll });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
