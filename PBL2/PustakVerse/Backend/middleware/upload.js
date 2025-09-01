const multer = require("multer");

const uploadErrorHandler = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "File too large. Maximum size is 5MB." });
    }
    return res.status(400).json({ error: error.message });
  }
  if (error.message.includes("Invalid file type")) {
    return res.status(400).json({ error: error.message });
  }
  next(error);
};

module.exports = uploadErrorHandler;
