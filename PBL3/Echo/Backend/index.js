const express = require("express");
const cors = require("cors");
const clipRoutes = require("./routes/clips");

const app = express();
app.use(express.json());
app.use(cors());

app.use("/uploads", express.static("uploads"));
app.use("/api/clips", clipRoutes);

app.listen(5000, () => {
  console.log("Listening at port 5000");
});
