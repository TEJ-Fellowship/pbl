/**
 * Wraps async functions to handle errors automatically
 * Eliminates the need for try-catch blocks in controllers
 * Attaches a .catch(next) to forward any errors to Express's error-handling middleware.
 * @param {Function} fn - The async function to wrap
 * @returns {Function} - The wrapped function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = { asyncHandler };
