const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
app.use(express.json());
app.use(cors());


const url = process.env.MONGODB_URL;

app.get("/info", (request, response) => {
  response.send(`
    <div>Hello from server</div>
    `);
});





app.listen(process.env.PORT, () => {
  console.log(`server is running on port ${process.env.PORT}`);
});
