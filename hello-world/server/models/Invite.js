import mongoose from "mongoose";
import crypto from "crypto";

const inviteSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["student", "mentor", "instructor", "admin"],
      required: true,
    },
    cohort: {
      type: String,
      required: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "expired"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique token before saving
inviteSchema.pre("save", function (next) {
  if (!this.token) {
    this.token = crypto.randomBytes(32).toString("hex");
  }
  next();
});

// Check if invite is expired
inviteSchema.methods.isExpired = function () {
  return new Date() > this.expiresAt;
};

// Mark invite as accepted
inviteSchema.methods.accept = function () {
  this.status = "accepted";
  return this.save();
};

// Static method to find valid invite
inviteSchema.statics.findValidInvite = function (token) {
  return this.findOne({
    token,
    status: "pending",
    expiresAt: { $gt: new Date() },
  }).populate("invitedBy", "name email role");
};

export default mongoose.model("Invite", inviteSchema);
