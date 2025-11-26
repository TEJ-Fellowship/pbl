import express from "express";
import dotenv from "dotenv";
import { sequelize, initializeCassandra } from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import "./models/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Instagram Feed API is running!" });
});

async function startServer() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: false });
    await initializeCassandra();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Unable to start server:", error);
    process.exit(1);
  }
}

startServer();
