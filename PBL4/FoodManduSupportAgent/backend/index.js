import express from "express";
import cors from "cors";
import foodmanduRoute from "./src/routes/foodmanduRoute.js";

const app = express();
app.use(cors());
app.use(express.json());

// Attach the route
app.use("/api", foodmanduRoute);

app.listen(5000, () => console.log("🚀 Server running on port 5000"));
