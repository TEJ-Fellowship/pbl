require("dotenv").config();

const express = require("express");
const cors = require("cors")
const path = require("path");
const connectDB = require('./config/db')
const authRoutes = require('./routes/authRoutes');
const incomeRoutes = require('./routes/incomeRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');


const app = express();
// Parse JSON request bodies
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//middleware to handle cors

app.use(
    cors({ 
        origin: process.env.CLIENT_URL || "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(express.json());

//connecting to database
connectDB();

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/income", incomeRoutes);
app.use("/api/v1/expense", expenseRoutes); 
app.use("/api/v1/dashboard", dashboardRoutes); 


//serve uploads folder


const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=> console.log(`Server running on port at ${PORT}`));