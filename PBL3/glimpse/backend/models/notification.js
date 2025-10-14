const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true }, // name of subscription plan
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

const Notification = mongoose.model("notification", notificationSchema);

module.exports = Notification;
