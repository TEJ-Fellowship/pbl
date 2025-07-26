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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    collaborators: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["contributor", "reviewer", "maintainer"],
          default: "contributor",
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
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
    week: {
      type: Number,
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

// Method to check if user is a collaborator
projectSchema.methods.isCollaborator = function (userId) {
  return this.collaborators.some((c) => c.userId.equals(userId));
};

// Method to get collaborator role
projectSchema.methods.getCollaboratorRole = function (userId) {
  const collaborator = this.collaborators.find((c) => c.userId.equals(userId));
  return collaborator ? collaborator.role : null;
};

export default mongoose.model("Project", projectSchema);
