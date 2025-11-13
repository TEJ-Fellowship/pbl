const express = require("express");
const app = express();

const { connectToDatabase } = require("./utils/db");
const { PORT } = require("./utils/config");

const start = async () => {
  await connectToDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on port \n http://localhost:${PORT}`);
  });
};

start();
