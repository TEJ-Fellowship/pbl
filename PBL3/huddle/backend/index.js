import express from "express";
import dotenv from "dotenv";
import router from "./routes/route.js";
import { Database } from "./config/db.js";
dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

app.use("/api/users", router);

Database()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`app running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  });
