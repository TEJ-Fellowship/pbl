const Event = require("../models/Event");
const { ValidationError } = require("../errors");

/*
Note:
 * Creates an event for the given user.
  - Validates business rules (e.g. end > start).
  - Builds the event with userId from the argument (never from client).
  - Saves and returns the created event, or throws ValidationError.
*/ 
async function create(userId, eventData) {
  const { title, start, end, description, location, isAllDay, color } = eventData;

  // Business rule: end must be after start
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (endDate <= startDate) {
    throw new ValidationError("End time must be after start time");
  }

  // Build document: only allowed fields; userId always from argument
  const doc = {
    title,
    start: startDate,
    end: endDate,
    userId,
    description: description ?? "",
    location: location ?? "",
    isAllDay: isAllDay ?? false,
    color: color ?? "#2196F3",
  };

  const event = await Event.create(doc);
  return event;
}

module.exports = { create };