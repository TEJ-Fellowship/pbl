/**
 * Ensures Passport session has a logged-in user.
 */
function requireAuth(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

module.exports = { requireAuth };
