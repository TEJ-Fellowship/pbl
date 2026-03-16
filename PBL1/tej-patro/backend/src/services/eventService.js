const Event = require("../models/Event");
const mongoose = require("mongoose");
const { ValidationError, NotFoundError, ForbiddenError } = require("../errors");

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

/*
Note:

यस function को काम: एउटा user का सबै events ल्याउने, र आवश्यक भएमा date अनुसार फिल्टर गर्ने।

-userId अनुसार फिल्टर: पहिले events userId सँग मेल खाने छनोट गरिन्छ।
-start date दिइएमा: त्यो date पछि सकिने event मात्र समावेश हुन्छ।
-end date दिइएमा: त्यो date भन्दा पहिले सुरु भएका event मात्र समावेश हुन्छ।
-date validation: string date भएमा Date object मा रूपान्तरण गरी ठिक छ कि छैन जाँचिन्छ।
-sort र return: events start date अनुसार क्रमबद्ध गरी plain JavaScript object को रूपमा फर्काइन्छ।
*/
async function list(userId, options = {}) {
  const query = { userId };

  if (options.start != null) {
    const startDate = options.start instanceof Date ? options.start : new Date(options.start);
    if (!isNaN(startDate.getTime())) {
      query.end = { ...(query.end || {}), $gte: startDate };
    }
  }
  if (options.end != null) {
    const endDate = options.end instanceof Date ? options.end : new Date(options.end);
    if (!isNaN(endDate.getTime())) {
      query.start = { ...(query.start || {}), $lte: endDate };
    }
  }

  const events = await Event.find(query).sort({ start: 1 }).lean();
  return events;
}

/*
 * Update an event. Only the owner can update.
 * Throws ValidationError (400), NotFoundError (404), or ForbiddenError (403).
 */
async function update(userId, eventId, eventData) {
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new ValidationError("Invalid event id");
  }

  const event = await Event.findById(eventId);
  if (!event) {
    throw new NotFoundError("Event not found");
  }
  if (event.userId !== userId) {
    throw new ForbiddenError("You are not allowed to update this event");
  }

  const { title, start, end, description, location, isAllDay, color } = eventData;

  const updates = {};
  if (title !== undefined) updates.title = typeof title === "string" ? title.trim() : title;
  if (start !== undefined) updates.start = new Date(start);
  if (end !== undefined) updates.end = new Date(end);
  if (description !== undefined) updates.description = description ?? "";
  if (location !== undefined) updates.location = location ?? "";
  if (isAllDay !== undefined) updates.isAllDay = Boolean(isAllDay);
  if (color !== undefined) updates.color = color ?? "#2196F3";

  const startDate = updates.start ?? event.start;
  const endDate = updates.end ?? event.end;
  if (endDate <= startDate) {
    throw new ValidationError("End time must be after start time");
  }

  event.set(updates);
  await event.save();

  return event;
}

/*
 * Delete an event. Only the owner can delete.
 * Throws ValidationError (400), NotFoundError (404), or ForbiddenError (403).
 * Returns the deleted event (or { deleted: true }) for the controller to send 204/200.
 */
async function remove(userId, eventId) {
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new ValidationError("Invalid event id");
  }

  const event = await Event.findById(eventId);
  if (!event) {
    throw new NotFoundError("Event not found");
  }
  if (event.userId !== userId) {
    throw new ForbiddenError("You are not allowed to delete this event");
  }

  await Event.findByIdAndDelete(eventId);
  return { deleted: true, id: eventId };
}

/**
 * Parse start/end from query and build options for list().
 * Returns { options } or { error, statusCode } for invalid dates.
 */

function parseListOptionsFromQuery(query) {
  const { start, end } = query ?? {};
  const options = {};
  if (start != null && start !== "") {
    const startDate = new Date(start);
    if (isNaN(startDate.getTime())) {
      return { error: "Invalid start date format", statusCode: 400 };
    }
    options.start = startDate;
  }
  if (end != null && end !== "") {
    const endDate = new Date(end);
    if (isNaN(endDate.getTime())) {
      return { error: "Invalid end date format", statusCode: 400 };
    }
    options.end = endDate;
  }
  return { options };
}

module.exports = { create, list, update, remove, parseListOptionsFromQuery };
