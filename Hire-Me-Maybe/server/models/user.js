const mongoose = require("mongoose");
const { emailRegex, passwordRegex } = require("../utils/regex/userRegex");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Please provie username"],
    minlength: [3, "Username must be at least 3 characters long"],
    unique: true,
  },
  email: {
    type: String,
    required: [true, "Please provide email"],
    unique: true,
    match: [emailRegex, "Please provide a valid email"],
  },
  password: {
    type: String,
    required: [true, "Please provide password"],
    match: [
      passwordRegex,
      "Password must include uppercase, lowercase, number, and special character",
    ],
  },
});

userSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
