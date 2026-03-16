const eventService = require("../services/eventService");

const createEvent = async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      organizer: req.user._id,
    };
    const event = await eventService.createEvent(eventData);
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAllEvents = async (req, res) => {
  try {
    const filters = req.query; // Handle any query parameters
    const events = await eventService.getAllEvents(filters);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await eventService.getEventById(req.params.id);
    res.json(event);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

const updateEvent = async (req, res) => {
  try {
    const event = await eventService.updateEvent(
      req.params.id,
      req.user._id,
      req.body
    );
    res.json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    await eventService.deleteEvent(req.params.id, req.user._id);
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const joinEvent = async (req, res) => {
  try {
    const event = await eventService.joinEvent(req.params.id, req.user._id);
    res.json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateParticipationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const event = await eventService.updateParticipationStatus(
      req.params.id,
      req.user._id,
      status
    );
    res.json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getEventsByUser = async (req, res) => {
  try {
    const { type } = req.query; // 'organizing' or 'participating'
    const userId = req.params.userId || req.user._id;
    const events = await eventService.getEventsByUser(userId, type);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  joinEvent,
  updateParticipationStatus,
  getEventsByUser,
};
