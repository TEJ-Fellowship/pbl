// routes/statsRoutes.js

const express = require("express");
const router = express.Router();
const { getQuizStats } = require("../controllers/statsController");

router.get("/", getQuizStats);

module.exports = router;
