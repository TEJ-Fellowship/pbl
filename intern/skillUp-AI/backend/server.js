const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const errorHandler = require("./middleware/errorHandler");
// Middlewares
app.use(express.json());
app.use(cors());



// Import the user route
const authRouter = require("./routes/auth"); // wherever your route file is
app.use("/api/auth", authRouter); // prefix all routes in authRouter with /api/auth



//Global error handler
app.use(errorHandler);

app.listen(process.env.PORT, () => {
  console.log(`server is running on port ${process.env.PORT}`);
});
