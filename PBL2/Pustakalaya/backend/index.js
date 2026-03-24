const mongoose = require("mongoose");

/*- Imports environment variables from a .env file */
require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 1000;

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    app.listen(PORT, () =>
      console.log(`Pustakalaya server is running on port ${PORT}`),
    );
  } catch (error) {
    /* - Standard error log: log the error */
    console.log("❌ MongoDB connection error: ", error.message);
    process.exit(1);
  }
}
connectDB();
