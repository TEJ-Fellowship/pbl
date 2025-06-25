const mongoose = require("mongoose");
const {
  EMAIL_REGEX,
  PASSWORD_REGEX,
  PHONE_REGEX,
  PROF_PICTURE_URL_REGEX,
} = require("../utils/regex/userRegex.js");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    max: 25,
    min: 3,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
    match: [EMAIL_REGEX, "Invalid email format!"],
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    match: [
      PASSWORD_REGEX,
      "Password must be at least 8 characters and include letters and numbers",
    ],
  },
  phone: {
    type: String,
    unique: true,
    required: true,
    match: [PHONE_REGEX, "Invalid phone format!"],
  },
  role: { type: String, enum: ["helper", "requester"], default: "requester" },
  location: String,
  karmaPoints: { type: Number, default: 0 },
  badges: [String],
  completedTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
});

const model = mongoose.model("User", userSchema);

module.exports = model;
