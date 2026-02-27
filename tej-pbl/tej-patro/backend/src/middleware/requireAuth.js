/*
Note:
 * Require authenticated user to create events. Use on routes that must be protected.
 * If the user is not logged in, responds with 401 and does not call next().
 */
function requireAuth(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) {
      return next();
    }
    return res.status(401).json({ error: "Authentication required" });
  }
  
  module.exports = { requireAuth };
