const User = require("../models/user");

app.post("/api/auth/register", async (request, response, next) => {
  try {
    const { fullName, email, password } = request.body;

    const newUser = new User({ fullName, email, password });

    await newUser.save();

    response
      .status(201)
      .json({ message: "user created successfully", user: newUser });
  } catch (error) {
    next(error);
  }
});

const errorHandler = (error, request, response, next) => {
  console.error(error.message);

  if (error.name === "CastError") {
    // Invalid ObjectId format (e.g., malformed MongoDB _id)
    return response.status(400).send({ error: "malformatted id" });
  } else if (error.name === "ValidationError") {
    // Mongoose schema validation failed (invalid or missing data)
    return response.status(400).json({ error: error.message });
  } else if (error.name === "MongoServerError" && error.code === 11000) {
    // Unique constraint violation (duplicate value for a field marked as unique)
    return response.status(400).json({ error: "Duplicate field value" });
  }

  next(error);
};

app.use(errorHandler);
