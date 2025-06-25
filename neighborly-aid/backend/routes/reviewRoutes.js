const express = require("express");
const router = express.Router();
const {
  createReview,
  getReviewById,
  getReviewsByTask,
  getReviewsByUser,
  updateReview,
  deleteReview,
  getAverageRating,
} = require("../controllers/reviewController");
const auth = require("../middlewares/auth-middleware");

// Apply auth middleware to all routes
router.use(auth);

// Create a new review
router.post("/", createReview);

// Get specific review
router.get("/:id", getReviewById);

// Get reviews for a specific task
router.get("/task/:taskId", getReviewsByTask);

// Get reviews by user (given or received)
router.get("/user", getReviewsByUser); // for current user
router.get("/user/:userId", getReviewsByUser); // for specific user

router.get("/rating", getAverageRating); // for current user
router.get("/rating/:userId", getAverageRating); // for specific user

// Update review
router.put("/:id", updateReview);

// Delete review
router.delete("/:id", deleteReview);

module.exports = router;
