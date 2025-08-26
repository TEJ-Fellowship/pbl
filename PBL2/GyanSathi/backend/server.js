import express from "express";
import cors from "cors";
import router from "./routers/router.js";
import { dataBase } from "./config/db.js";
const PORT = process.env.PORT || 5001;
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);
app.use("/api/notes", router);

dataBase().then(() => {
  app.listen(PORT, () => {
    console.log(`The server is running at http://localhost:${PORT}`);
  });
});
