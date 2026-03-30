/*- Imports environment variables from a .env file */
require("dotenv").config();
const { connectDB } = require("./config/db");

const PORT = process.env.PORT || 1000;

async function startServer() {
  try {
    // 1) connect first
    await connectDB();
    // 2) load app after DB ready
    const app = require("./app");
    app.listen(PORT, () =>
      console.log(`Pustakalaya server is running on port ${PORT}`),
    );
  } catch (error) {
    /* - Standard error log: log the error */
    console.log("❌ MongoDB connection error: ", error.message);
    process.exit(1);
  }
}

startServer();
