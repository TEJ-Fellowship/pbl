const mongoose = require("mongoose");
const { ValidationError } = require("../errors");

/*
Note:
 * Validates request body for create event.
  - Use before eventsController.create.
  - On invalid body, passes ValidationError to next(); global error handler sends 400.
*/
function validateCreateEvent(req, res, next) {
  const { title, start, end } = req.body || {};
  const errors = [];

  if (!title || typeof title !== "string" || !title.trim()) {
    errors.push("title is required and must be a non-empty string");
  }
  if (start == null) {
    errors.push("start is required");
  } else {
    const startDate = new Date(start);
    if (Number.isNaN(startDate.getTime())) errors.push("start must be a valid date");
  }
  if (end == null) {
    errors.push("end is required");
  } else {
    const endDate = new Date(end);
    if (Number.isNaN(endDate.getTime())) errors.push("end must be a valid date");
  }

  if (errors.length > 0) {
    return next(new ValidationError(errors.join("; ")));
  }

  next();
}

/*
Note:
 * Validates PUT /api/events/:id — params.id (ObjectId) and body (partial update).
 * Task 2.1: validateUpdateEvent — same rules as create for any field that is present.
 * Task 2.2: Partial update — only validates fields that are present; client can send only changed fields.
 * Task 2.3: req.params.id must be a valid MongoDB ObjectId → 400 if malformed.
 */
function validateUpdateEvent(req, res, next) {
  const errors = [];

  // 2.3 — Validate req.params.id is a valid MongoDB ObjectId
  const eventId = req.params.id;
  if (!eventId) {
    errors.push("event id is required");
  } else if (!mongoose.Types.ObjectId.isValid(eventId)) {
    errors.push("event id must be a valid MongoDB ObjectId");
  }

  const body = req.body || {};
  const { title, start, end } = body;

  // 2.2 — Partial: only validate fields that are present
  if (body.hasOwnProperty("title")) {
    if (title == null || typeof title !== "string" || !title.trim()) {
      errors.push("title must be a non-empty string");
    }
  }
  if (body.hasOwnProperty("start")) {
    const startDate = new Date(start);
    if (Number.isNaN(startDate.getTime())) {
      errors.push("start must be a valid date");
    }
  }
  if (body.hasOwnProperty("end")) {
    const endDate = new Date(end);
    if (Number.isNaN(endDate.getTime())) {
      errors.push("end must be a valid date");
    }
  }

  // If both start and end are present, enforce end > start
  if (body.hasOwnProperty("start") && body.hasOwnProperty("end")) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()) && endDate <= startDate) {
      errors.push("end must be after start");
    }
  }

  if (errors.length > 0) {
    return next(new ValidationError(errors.join("; ")));
  }

  next();
}

/*
 * Validates req.params.id is a valid MongoDB ObjectId.
 * Use for GET one, PUT, DELETE by id. On invalid id → next(ValidationError) → 400.
 */
function validateEventId(req, res, next) {
  const eventId = req.params.id;
  if (!eventId) {
    return next(new ValidationError("event id is required"));
  }
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return next(new ValidationError("event id must be a valid MongoDB ObjectId"));
  }
  next();
}

module.exports = { validateCreateEvent, validateUpdateEvent, validateEventId };
