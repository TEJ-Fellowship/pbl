// routes/auth.js
const router = require("express").Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");

// Initialize Google OAuth flow
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

// Google OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:5173/login?error=auth_failed",
    session: false, // We'll use JWT instead of session
  }),
  (req, res) => {
    try {
      // Generate JWT token
      const token = jwt.sign(
        {
          id: req.user._id,
          email: req.user.email,
          name: req.user.name,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" },
      );

      // Redirect to frontend with token
      res.redirect(`http://localhost:5173/auth-success?token=${token}`);
    } catch (error) {
      res.redirect("http://localhost:5173/login?error=token_generation_failed");
    }
  },
);

// Get current user (protected route example)
router.get("/user", authenticateToken, (req, res) => {
  res.json(req.user);
});

// Logout
router.post("/logout", (req, res) => {
  res.json({ message: "Logged out successfully" });
});

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
}

module.exports = router;
