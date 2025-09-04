// models/User.js
// import bcrypt from "bcrypt";
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  name: { type: String },
  createdAt: { type: Date, default: Date.now },
});

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    // the passwordHash should not be revealed
    // delete returnedObject.passwordHash
  }
})


const User = mongoose.model("User", userSchema);

module.exports = User