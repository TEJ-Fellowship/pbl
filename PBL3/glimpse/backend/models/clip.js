const mongoose = require('mongoose')

const clipSchema = new mongoose.Schema({
  // user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  videoUrl: { type: String, required: true }, // Cloudinary or S3b
  publicId: { type: String, required: true },
  // thumbnailUrl: { type: String },
  // downloadUrl: { type: String },
  // day: { type: Date, required: true }, // which day the clip belongs to
  // caption: { type: String }, // AI auto-captions (optional, Tier 3)
  date: {
    type: String, // must be String, not Date
    required: true,
    default: () => {
      const today = new Date();
      return today.toISOString().split("T")[0]; // "YYYY-MM-DD"
    },
  }

})
clipSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const Clip =  mongoose.model("Clip", clipSchema);

module.exports = Clip


