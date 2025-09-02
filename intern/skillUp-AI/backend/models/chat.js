const mongoose = require("mongoose");

mongoose.set("strictQuery", false);

const chatSchema = new mongoose.Schema({
  userId : String,
  topic :  String,
  userRequest : String,
  answer : String,
});

module.exports = mongoose.model("Chat", chatSchema);
