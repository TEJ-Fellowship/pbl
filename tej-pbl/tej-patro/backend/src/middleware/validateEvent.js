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

module.exports = { validateCreateEvent };