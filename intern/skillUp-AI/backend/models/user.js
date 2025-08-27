const mongoose = require("mongoose");
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

userSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("User", userSchema);
