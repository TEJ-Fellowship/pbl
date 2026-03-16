/*
Note:
 Custom errors so the global error handler can send the right HTTP status.
  - ValidationError → 400 (bad request, e.g. "end must be after start")
  - ConflictError  → 409 (e.g. overlapping events, if you add that later)
 */

class ValidationError extends Error {
    constructor(message) {
      super(message);
      this.name = "ValidationError";
      this.statusCode = 400;
    }
  }
  
  class ConflictError extends Error {
    constructor(message) {
      super(message);
      this.name = "ConflictError";
      this.statusCode = 409;
    }
  }

  class NotFoundError extends Error {
    constructor(message = "Not found") {
      super(message);
      this.name = "NotFoundError";
      this.statusCode = 404;
    }
  }
  
  class ForbiddenError extends Error {
    constructor(message = "Forbidden") {
      super(message);
      this.name = "ForbiddenError";
      this.statusCode = 403;
    }
  }
  
  module.exports = { ValidationError, ConflictError, NotFoundError, ForbiddenError };
