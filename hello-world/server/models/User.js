import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    githubId: {
      type: String,
      unique: true,
      sparse: true, // Allow null values, but enforce uniqueness when present
    },
    username: {
      type: String,
      unique: true,
      sparse: true, // Allow null values, but enforce uniqueness when present
    },
    email: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
      select: false, // Don't include password in queries by default
    },
    name: {
      type: String,
      required: true,
    },
    preferredName: {
      type: String,
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
    registrationType: {
      type: String,
      enum: ["invite", "direct"],
      default: "direct",
    },
    role: {
      type: String,
      enum: ["guest", "student", "mentor", "instructor", "admin"],
      default: "guest",
    },
    status: {
      type: String,
      enum: ["pending", "active", "suspended"],
      default: "active", // Changed default to active for direct registrations
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Made optional for direct registrations
    },
    emailVerified: {
      type: Boolean,
      default: false,
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
    blacklistedTokens: [
      {
        token: String,
        expiresAt: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Define role permissions
userSchema.statics.getRolePermissions = function (role) {
  const permissions = {
    guest: ["view_public_projects", "view_public_profiles"],
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
