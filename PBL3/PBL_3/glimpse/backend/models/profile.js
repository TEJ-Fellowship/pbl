const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    displayName: { type: String, required: true },
    profilePictureUrl: { type: String, required: true },
    totalSeconds: { type: Number, required: true },
    totalStreaks: { type: Number, required: true },
  },
  { timestamps: true }
);

profileSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

const Profile = mongoose.model("Profile", profileSchema);
module.exports = Profile;
