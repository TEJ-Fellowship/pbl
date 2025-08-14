

const express = require('express');
const { protect } = require("../middlware/authMiddlware.js");
const { getDashboardData } = require('../controllers/dashboardController.js');

const router = express.Router();

router.get('/', protect, getDashboardData); // Get dashboard data


module.exports = router;