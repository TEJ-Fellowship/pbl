const express = require("express");
const router = express.Router();
const eventsController = require("../controllers/eventsController");
const { validateCreateEvent } = require("../middleware/validateEvent");
const { requireAuth } = require("../middleware/requireAuth");

// POST /api/events — create event (add requireAuth in Phase 4)
router.post("/", requireAuth, validateCreateEvent, eventsController.create);

module.exports = router;
