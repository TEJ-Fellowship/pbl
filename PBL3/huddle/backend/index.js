import express from "express";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT;
const app = express();

app.get("/", (req, res) => {
  res.send("Hello, This is from Huddle");
});

app.listen(PORT, () => {
  console.log(`app running at http://localhost:${PORT}`);
});
