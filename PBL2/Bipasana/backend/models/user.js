const config = require('../utils/config');
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

mongoose
  .connect(config.MONGODB_URL)
  .then(() => {
    console.log("Connected to MemoNestDB");
  })
  .catch((err) => console.error(err));

const userSchema = new mongoose.Schema({
  username: String,
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: String,
  verificationToken: String,
  journals: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Journal",
    },
  ],
  isVerified: {
    type: Boolean,
    default: false,
  },
});
userSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.password; //the hashpassword mustnot be revealed
  },
});

const User = mongoose.model("User", userSchema);

module.exports = { User };
