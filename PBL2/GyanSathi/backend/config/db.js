import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

console.log(process.env.MONGOOSE_URI);
export const dataBase = async () => {
  try {
    await mongoose.connect(process.env.MONGOOSE_URI);
    console.log("DATABASE is connected successfully!");
  } catch (error) {
    console.log(error);
    process.exit(1); //1 ley kunai failure bata end hunchha: 0 chahi kunai pani failur hunna
  }
};
