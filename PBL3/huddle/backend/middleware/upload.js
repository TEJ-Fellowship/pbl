import multer from "multer";

// Ensuring the file is audio file
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    file.mimetype.startsWith("audio/")
      ? callback(null, true)
      : callback(
          new Error("Unsupported file. Please upload an audio file."),
          false
        );
  },
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        message: "File is too large. Maximum size is 10MB.",
      });
    }
    return res.status(400).json({
      message: `Upload error: ${err.message}`,
    });
  } else if (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
  next();
};

export { upload, handleMulterError };
