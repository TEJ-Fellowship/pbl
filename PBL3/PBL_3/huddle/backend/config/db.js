import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export const Database = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Database is successfully connected!");
  } catch (error) {
    console.log("Error during Database connection", error);
    process.exit(1); // yo chahi database lai disconnect gardinchha yedi kehi error aayema!
  }
};
