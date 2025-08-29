const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

require("dotenv").config();

const url = process.env.MONGODB_URL;

mongoose.set("strictQuery", false);

mongoose
  .connect(url)
  .then((result) => {
    console.log("Connected to mongoDB");
  })
  .catch((error) => {
    console.log(error, "error on mongoDB connection");
  });

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    minlength: 6,
    maxlength: 20,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // optional but recommended
    match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, // simple email regex validation
  },
  password: {
    type: String,
    required: true,
    minlength: 6, // optional: set a minimum password length
  },
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  try {
    console.log("Pre-save middleware running...");
    console.log("Password modified:", this.isModified("password"));
    
    if (!this.isModified("password")) return next();
    console.log("Original password:", this.password); // Before hashing

    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
    console.log("Hashed password:", this.password); // After hashing

    next();
  } catch (err) {
    next(err);
  }
});

userSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.password; // ADD THIS LINE to never send password in JSON response
  },
});

module.exports = mongoose.model("User", userSchema);
