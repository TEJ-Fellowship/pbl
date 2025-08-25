const Event = require("../models/Events");

const createEvent = async (eventData) => {
  try {
    const event = new Event(eventData);
    await event.save();
    return await event.populate("organizer", "name email");
  } catch (error) {
    throw error;
  }
};

const getAllEvents = async (filters = {}) => {
  try {
    return await Event.find(filters)
      .populate("organizer", "name email")
      .populate("participants.user", "name email")
      .sort({ date: 1 });
  } catch (error) {
    throw error;
  }
};

const getEventById = async (eventId) => {
  try {
    const event = await Event.findById(eventId)
      .populate("organizer", "name email")
      .populate("participants.user", "name email");

    if (!event) {
      throw new Error("Event not found");
    }
    return event;
  } catch (error) {
    throw error;
  }
};

const updateEvent = async (eventId, organizerId, updateData) => {
  try {
    const event = await Event.findOne({
      _id: eventId,
      organizer: organizerId,
    });

    if (!event) {
      throw new Error("Event not found or unauthorized");
    }

    Object.assign(event, updateData);
    await event.save();

    return await event.populate("organizer participants.user", "name email");
  } catch (error) {
    throw error;
  }
};

const deleteEvent = async (eventId, organizerId) => {
  try {
    const event = await Event.findOneAndDelete({
      _id: eventId,
      organizer: organizerId,
    });

    if (!event) {
      throw new Error("Event not found or unauthorized");
    }
    return event;
  } catch (error) {
    throw error;
  }
};

const joinEvent = async (eventId, userId) => {
  try {
    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Check if user is already a participant
    const existingParticipant = event.participants.find(
      (p) => p.user.toString() === userId.toString()
    );

    if (existingParticipant) {
      throw new Error("Already registered for this event");
    }

    // Check max participants limit
    if (
      event.maxParticipants &&
      event.participants.length >= event.maxParticipants
    ) {
      throw new Error("Event has reached maximum participants");
    }

    event.participants.push({ user: userId });
    await event.save();

    return await event.populate("organizer participants.user", "name email");
  } catch (error) {
    throw error;
  }
};

const updateParticipationStatus = async (eventId, userId, status) => {
  try {
    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    const participant = event.participants.find(
      (p) => p.user.toString() === userId.toString()
    );

    if (!participant) {
      throw new Error("Not registered for this event");
    }

    participant.status = status;
    await event.save();

    return await event.populate("organizer participants.user", "name email");
  } catch (error) {
    throw error;
  }
};

const getEventsByUser = async (userId, type = "participating") => {
  try {
    if (type === "organizing") {
      return await Event.find({ organizer: userId })
        .populate("organizer participants.user", "name email")
        .sort({ date: 1 });
    } else {
      return await Event.find({
        "participants.user": userId,
      })
        .populate("organizer participants.user", "name email")
        .sort({ date: 1 });
    }
  } catch (error) {
    throw error;
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
