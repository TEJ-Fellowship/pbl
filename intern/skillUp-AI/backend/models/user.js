const mongoose = require("mongoose");
require("dotenv").config();

const url = process.env.MONGODB_URL;

mongoose.set("strictQuery", false);

mongoose
  .connect(url)
  .then((result) => {
    console.log("Connected to mongoDB");
  })
  .catch((error) => {
    console.log(error, "error on mongoDB connection");
  });
