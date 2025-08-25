const mongoose = require("mongoose");

const url = process.env.MONGODB_URL;

mongoose.set("strictQuery", false);

mongoose
  .connect(url)
  .then(() => {
    console.log("Connected to MemeNestDB");
  })
  .catch((err) => console.error(err));

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  verificationToken: String,
  isVerified: {
    type: Boolean,
    default: false
  },
});

const User = mongoose.model("users", userSchema);

module.exports = { User };
