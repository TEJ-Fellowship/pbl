const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.listen(1000, () =>
  console.log("Pustakalaya server is running on port 1000"),
);
