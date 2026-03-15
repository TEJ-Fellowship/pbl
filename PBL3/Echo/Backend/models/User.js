//models/User
const mongoose = require("mongoose");
const config = require("../utils/config");

// connecting the mongodb database
mongoose
  .connect(
    `mongodb+srv://echowebapp_db_user:${config.passwordofDB}@cluster0.ylwwstr.mongodb.net/Echowebapp?retryWrites=true&w=majority&appName=Cluster0`
  )
  .then(() => console.log("MongoDB successfully connnected!"))
  .catch((err) => console.log("Error:", err));

// now making the userschema for the credentials
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    minlength: 3,
    unique: true,
    required: true,
  },
  passwordHash: {
    type: String,
    minlength: 8,
    required: true,
  },
});

// making the user model now
const User = mongoose.model("User", userSchema);
module.exports = User;
