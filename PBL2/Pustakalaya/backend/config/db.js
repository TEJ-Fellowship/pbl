const mongoose = require("mongoose");
require("dotenv").config();

async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");
}
/* - Export the connectDB function and mongoose connection */
module.exports = {
  connectDB,
  mongooseConnection: mongoose.connection,
};
