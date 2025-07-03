const { info, errorLogger } = require("../utils/logger");

const requestLogger = (request, response, next) => {
  info("Method:", request.method);
  info("Path:  ", request.path);
  info("Body:  ", request.body);
  info("used api method");
  next();
};

const noHandler = (request, response) => {
  response.status(404).send("<h1>No routes found for this request</h1>");
};

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};

const errorHandler = (error, request, response, next) => {
  errorLogger(error.message);
  if (error.name === "CastError") {
    return response.status(400).send({ error: "malformatted id" });
  } else if (error.name === "ValidationError") {
    return response.status(400).json({ error: error.message });
  } else if (error.name === "ReferenceError") {
    return response.status(400).json({ error: error.message });
  } else if (error.name === "MongoServerError" && error.code === 11000) {
    console.log("this is error");
    return response.status(400).json({ error: error.message });
  } else if (error.message.includes("ECONNREFUSED")) {
    console.error("💡 Make sure MongoDB is running on your machine");
  } else if (error.message.includes("ENOTFOUND")) {
    console.error("💡 Check your MongoDB URI format");
  } else if (error.message.includes("MONGODB_URI is not defined")) {
    console.error("💡 Check your .env file");
  } else if (error.message.includes("AggregateError")) {
    console.error(
      "💡 Network or authentication issue. Check your MongoDB URI and network connection"
    );
  }
  next(error);
};

module.exports = {
  requestLogger,
  unknownEndpoint,
  noHandler,
  errorHandler,
};
