import mongoose from "mongoose";
import dotenv from "dotenv";


dotenv.config();
export const connectDB = async ()=>{
    try{
        console.log("Mongo URI:", process.env.MONGODB_URL);
        await mongoose.connect(process.env.MONGODB_URL,{
        useNewUrlParser: true,
        useUnifiedTopology: true,
        });
        console.log("MongoDB Connected");
    }catch(error){
        console.error(error);
        process.exit(1);
    }
;}