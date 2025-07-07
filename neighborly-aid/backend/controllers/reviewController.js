const reviewService = require("../services/reviewService");

const createReview = async (req, res) => {
  try {
    const reviewData = {
      ...req.body,
      reviewer: req.user._id,
    };

    const review = await reviewService.createReview(reviewData);
    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getReviewById = async (req, res) => {
  try {
    const review = await reviewService.getReviewById(req.params.id);
    res.json(review);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

const getReviewsByTask = async (req, res) => {
  try {
    const reviews = await reviewService.getReviewsByTask(req.params.taskId);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getReviewsByUser = async (req, res) => {
  try {
    const { type } = req.query; // 'given' or 'received'
    const userId = req.params.userId || req.user._id;
    const reviews = await reviewService.getReviewsByUser(userId, type);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateReview = async (req, res) => {
  try {
    const review = await reviewService.updateReview(
      req.params.id,
      req.user._id,
      req.body
    );
    res.json(review);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteReview = async (req, res) => {
  try {
    await reviewService.deleteReview(req.params.id, req.user._id);
    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAverageRating = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const stats = await reviewService.getAverageRating(userId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createReview,
  getReviewById,
  getReviewsByTask,
  getReviewsByUser,
  updateReview,
  deleteReview,
  getAverageRating,
};
