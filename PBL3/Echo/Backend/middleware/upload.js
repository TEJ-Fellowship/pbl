// middleware/upload.js
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { cloudinary } = require("../utils/config");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "audioclips", // folder name in Cloudinary
    resource_type: "video", // must be "video" for audio/video files
    format: async (req, file) => "mp3", // optional: force format
    public_id: (req, file) => Date.now() + "-" + file.originalname,
  },
});

const upload = multer({ storage });

module.exports = upload;
