import express from "express";
import router from "./routes/route.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

app.use("/", router);

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
