import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    githubUrl: {
      type: String,
      required: true,
    },
    liveUrl: {
      type: String,
    },
    technologies: [
      {
        type: String,
        required: true,
      },
    ],
    screenshots: [
      {
        type: String,
      },
    ],

    collaborators: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        name: String,
        githubUsername: String,
        role: String,
      },
    ],
    // Star system
    stars: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    starCount: {
      type: Number,
      default: 0,
    },
    // Reviews and feedback
    reviews: [
      {
        reviewer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
          required: true,
        },
        comment: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Meta information
    cohort: {
      type: String,
    },
    week: {
      type: Number,
    },
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Intermediate",
    },
    featured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
    },
    views: {
      type: Number,
      default: 0,
    },
    viewedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Update star count when stars array changes
projectSchema.pre("save", function (next) {
  if (this.isModified("stars")) {
    this.starCount = this.stars.length;
  }
  next();
});

// Method to toggle star
projectSchema.methods.toggleStar = function (userId) {
  const starIndex = this.stars.indexOf(userId);
  if (starIndex > -1) {
    this.stars.splice(starIndex, 1);
  } else {
    this.stars.push(userId);
  }
  return this.save();
};

// Method to check if user has starred
projectSchema.methods.isStarredBy = function (userId) {
  return this.stars.includes(userId);
};

// Method to increment view count
projectSchema.methods.incrementView = function (userId = null) {
  this.views += 1;
  if (userId && !this.viewedBy.some((view) => view.user.equals(userId))) {
    this.viewedBy.push({ user: userId });
  }
  return this.save();
};

export default mongoose.model("Project", projectSchema);
