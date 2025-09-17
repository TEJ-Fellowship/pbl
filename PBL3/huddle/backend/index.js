import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import router from "./routes/route.js";
import voiceNoteRoutes from "./routes/voiceNoteRoutes.js";
import { login, register } from "./controllers/authController.js";
import { Database } from "./config/db.js";
dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

app.use(cors());
app.use(express.json());

app.post("/register", register);
app.post("/login", login);

app.use("/api/users", router);
app.use("/api/voice-notes", voiceNoteRoutes);

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
