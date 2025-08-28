import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve("../.env") }); // <-- point to parent folder);

import propertyRoutes from "./routes/propertyRoutes.js";
import AuthRouter from "./routes/AuthRouter.js";

const app = express();

app.use(cors({ origin: ["http://localhost:5173"], credentials: true }));


app.use(express.json())
app.use('/uploads', express.static("uploads"))


console.log(process.env.CLOUDINARY_API_KEY)

const PORT = process.env.PORT || 8080; // Changed to 8080 to match the client API_URL

connectDB(process.env.MONGODB_URL).then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

app.use("/api/properties", propertyRoutes);
app.use("/auth", AuthRouter);
