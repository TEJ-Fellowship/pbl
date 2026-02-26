const express = require("express");
const router = express.Router();
const eventsController = require("../controllers/eventsController");
const { validateCreateEvent } = require("../middleware/validateEvent");

// POST /api/events — create event (add requireAuth in Phase 4)
router.post("/", validateCreateEvent, eventsController.create);

module.exports = router;