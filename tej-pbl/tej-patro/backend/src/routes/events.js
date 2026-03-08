const express = require("express");
const router = express.Router();
const eventsController = require("../controllers/eventsController");
const { validateCreateEvent, validateUpdateEvent } = require("../middleware/validateEvent");
const { requireAuth } = require("../middleware/requireAuth");

// POST /api/events — create event (add requireAuth in Phase 4)
router.post("/", requireAuth, validateCreateEvent, eventsController.create);

// GET /api/events — list current user's events
router.get("/", requireAuth, eventsController.list);

// PUT /api/events/:id — update event (Task 1)
router.put("/:id", requireAuth, validateUpdateEvent, eventsController.update);

module.exports = router;
