const express = require("express");
const journalRouter = express.Router();
const { Journal } = require("../models/journal.js");
const { User } = require("../models/user.js");
const { authenticateToken } = require("../utils/auth.js");

// Apply authentication middleware to all routes
journalRouter.use(authenticateToken);

journalRouter.get("/", async (req, res, next) => {
  try {
    const journals = await Journal.find({ userId: req.user.id });
    res.status(200).json(journals);
  } catch (error) {
    next(error);
  }
});

journalRouter.post("/", async (req, res, next) => {
  try {
    const { title, content, mood, createdAt } = req.body;


    const journal = new Journal({
      userId: req.user.id, // Use authenticated user ID
      title,
      mood,
      content,
      createdAt,
    });
    
    await journal.save();
    console.log("Journal saved");

    // Update user's journals array
    await User.findByIdAndUpdate(
      req.user.id,
      { $push: { journals: journal.id } },
      { new: true }
    );

    res.status(201).json({
      message: "Journal saved and referenced in user",
      journal: journal
    });
    console.log("Journal saved and user updated");
  } catch (err) {
    console.error(err);
    next(err);
  }
});

journalRouter.put("/:id", async (req, res, next) => {
  try {
    const journalId = req.params.id;
    const { title, content, mood } = req.body;

    // Find the journal and check if it belongs to the user
    const journal = await Journal.findById(journalId);

    if (!journal) {
      return res.status(404).json({ error: "Journal not found" });
    }

    // Check if the journal belongs to the authenticated user
    if (journal.userId.toString() !== req.user.id) {
      return res.status(403).json({
        error: "Access denied. You can only update your own journals.",
      });
    }

    // Update the journal with only the fields that are provided
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (mood !== undefined) updateData.mood = mood;
    updateData.updatedAt = new Date();

    const updatedJournal = await Journal.findByIdAndUpdate(
      journalId,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "Journal updated successfully",
      journal: updatedJournal,
    });

    console.log("Journal updated successfully");
  } catch (error) {
    next(error);
  }
});

journalRouter.delete("/:id", async (req, res, next) => {
  try {
    const journalId = req.params.id;

    // Find the journal and check if it belongs to the user
    const journal = await Journal.findById(journalId);

    if (!journal) {
      return res.status(404).json({ error: "Journal not found" });
    }

    // Check if the journal belongs to the authenticated user
    if (journal.userId.toString() !== req.user.id) {
      return res.status(403).json({
        error: "Access denied. You can only delete your own journals.",
      });
    }

    // Delete the journal
    await Journal.findByIdAndDelete(journalId);

    // Remove journal reference from user's journals array
    await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { journals: journalId } },
      { new: true }
    );

    res.status(200).json({
      message: "Journal deleted successfully",
      deletedJournalId: journalId,
    });

    console.log("Journal deleted successfully");
  } catch (error) {
    next(error);
  }
});

module.exports = journalRouter;