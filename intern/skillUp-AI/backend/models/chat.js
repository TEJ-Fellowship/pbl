const mongoose = require("mongoose");

mongoose.set("strictQuery", false);

const chatSchema = new mongoose.Schema({
  userId : String,
  topic :  String,
  userRequest : String,
  answer : String,
  user:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"User"
  },
});

module.exports = mongoose.model("Chat", chatSchema);
