// middlewares/errorHandler.js
const errorHandler = (error, req, res, next) => {
  console.error(error.message);

  if (error.name === "CastError") {
    return res.status(400).json({ error: "Malformatted ID" });
  } else if (error.name === "ValidationError") {
    return res.status(400).json({ error: error.message });
  } else if (error.name === "MongoServerError" && error.code === 11000) {
    return res.status(400).json({ error: "Duplicate field value" });
  }

  // Fallback for unhandled errors
  res.status(500).json({ error: "Something went wrong" });
};

module.exports = errorHandler;
