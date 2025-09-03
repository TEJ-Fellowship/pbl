import mongoose from "mongoose";

async function connectDB(uri) {
    try {
        await mongoose.connect(uri, {});
        console.log("Mongoose connected")
    } catch (err) {
        console.log('Mongodb connection error', err.message);
        process.exit(1)
    }
}

export default connectDB;