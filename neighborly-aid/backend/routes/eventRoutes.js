const express = require("express");
const router = express.Router();
const {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  joinEvent,
  updateParticipationStatus,
  getEventsByUser,
} = require("../controllers/eventController");
const auth = require("../middlewares/auth-middleware");

// Apply auth middleware to all routes
router.use(auth);

// Create a new event
router.post("/", createEvent);

// Get all events
router.get("/", getAllEvents);

// Get events by user
router.get("/user", getEventsByUser); // Current user's events
router.get("/user/:userId", getEventsByUser); // Specific user's events

// Join an event
router.post("/:id/join", joinEvent);

// Update participation status
router.put("/:id/participation", updateParticipationStatus);

// Get specific event
router.get("/:id", getEventById);

// Update event
router.put("/:id", updateEvent);

// Delete event
router.delete("/:id", deleteEvent);

module.exports = router;
