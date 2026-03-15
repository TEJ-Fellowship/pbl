const Review = require("../models/Review");
const Task = require("../models/Task");

const createReview = async (reviewData) => {
  try {
    // Check if task exists and is completed
    const task = await Task.findById(reviewData.task);
    if (!task) {
      throw new Error("Task not found");
    }
    if (task.status !== "completed") {
      throw new Error("Can only review completed tasks");
    }

    const review = new Review(reviewData);
    await review.save();

    return await Review.findById(review._id)
      .populate("reviewer", "name email")
      .populate("reviewee", "name email")
      .populate("task", "title");
  } catch (error) {
    throw error;
  }
};

const getReviewById = async (reviewId) => {
  try {
    const review = await Review.findById(reviewId)
      .populate("reviewer", "name email")
      .populate("reviewee", "name email")
      .populate("task", "title");

    if (!review) {
      throw new Error("Review not found");
    }
    return review;
  } catch (error) {
    throw error;
  }
};

const getReviewsByTask = async (taskId) => {
  try {
    return await Review.find({ task: taskId })
      .populate("reviewer", "name email")
      .populate("reviewee", "name email")
      .populate("task", "title")
      .sort({ createdAt: -1 });
  } catch (error) {
    throw error;
  }
};

const getReviewsByUser = async (userId, type = "received") => {
  try {
    const query =
      type === "received" ? { reviewee: userId } : { reviewer: userId };
    return await Review.find(query)
      .populate("reviewer", "name email")
      .populate("reviewee", "name email")
      .populate("task", "title")
      .sort({ createdAt: -1 });
  } catch (error) {
    throw error;
  }
};

const updateReview = async (reviewId, userId, updateData) => {
  try {
    const review = await Review.findOne({ _id: reviewId, reviewer: userId });
    if (!review) {
      throw new Error("Review not found or unauthorized");
    }

    // Only allow updating rating and comment
    const { rating, comment } = updateData;
    review.rating = rating || review.rating;
    review.comment = comment || review.comment;

    await review.save();

    return await Review.findById(review._id)
      .populate("reviewer", "name email")
      .populate("reviewee", "name email")
      .populate("task", "title");
  } catch (error) {
    throw error;
  }
};

const deleteReview = async (reviewId, userId) => {
  try {
    const review = await Review.findOneAndDelete({
      _id: reviewId,
      reviewer: userId,
    });

    if (!review) {
      throw new Error("Review not found or unauthorized");
    }
    return review;
  } catch (error) {
    throw error;
  }
};

const getAverageRating = async (userId) => {
  try {
    const result = await Review.aggregate([
      { $match: { reviewee: userId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    return result[0] || { averageRating: 0, totalReviews: 0 };
  } catch (error) {
    throw error;
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
