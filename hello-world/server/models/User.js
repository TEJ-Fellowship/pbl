import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    githubId: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
    },
    githubData: {
      bio: String,
      location: String,
      company: String,
      publicRepos: Number,
      followers: Number,
      following: Number,
      githubCreatedAt: Date,
      htmlUrl: String,
    },
    role: {
      type: String,
      enum: ["student", "mentor", "instructor", "admin"],
      default: "student",
    },
    status: {
      type: String,
      enum: ["pending", "active", "suspended"],
      default: "pending",
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    invitedAt: {
      type: Date,
    },
    lastLogin: {
      type: Date,
    },
    permissions: [
      {
        type: String,
      },
    ],
    cohort: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Define role permissions
userSchema.statics.getRolePermissions = function (role) {
  const permissions = {
    student: [
      "create_project",
      "edit_own_project",
      "star_project",
      "comment_project",
    ],
    mentor: [
      "create_project",
      "edit_own_project",
      "star_project",
      "comment_project",
      "review_project",
      "feature_project",
    ],
    instructor: [
      "create_project",
      "edit_own_project",
      "star_project",
      "comment_project",
      "review_project",
      "feature_project",
      "invite_student",
      "invite_mentor",
      "moderate_content",
      "view_analytics",
    ],
    admin: [
      "create_project",
      "edit_own_project",
      "star_project",
      "comment_project",
      "review_project",
      "feature_project",
      "invite_student",
      "invite_mentor",
      "invite_instructor",
      "moderate_content",
      "view_analytics",
      "manage_users",
      "system_settings",
    ],
  };

  return permissions[role] || permissions.student;
};

// Method to check if user has permission
userSchema.methods.hasPermission = function (permission) {
  return (
    this.permissions.includes(permission) ||
    this.constructor.getRolePermissions(this.role).includes(permission)
  );
};

// Method to update last login
userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save();
};

export default mongoose.model("User", userSchema);
