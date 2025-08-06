const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getDashboardData } = require("../controllers/dashboardController");

const app = express.Router();

app.get('/', protect, getDashboardData);

module.exports = app;