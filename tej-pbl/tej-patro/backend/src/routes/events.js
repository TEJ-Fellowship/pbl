const express = require("express");
const router = express.Router();
const eventsController = require("../controllers/eventsController");
const { validateCreateEvent, validateUpdateEvent, validateEventId } = require("../middleware/validateEvent");
const { requireAuth } = require("../middleware/requireAuth");

// POST /api/events — create event (add requireAuth in Phase 4)
router.post("/", requireAuth, validateCreateEvent, eventsController.create);

// GET /api/events — list current user's events
router.get("/", requireAuth, eventsController.list);

// PUT /api/events/:id — update event 
router.put("/:id", requireAuth, validateUpdateEvent, eventsController.update);

// DELETE /api/events/:id — delete event 
router.delete("/:id", requireAuth, validateEventId, eventsController.remove);

module.exports = router;
