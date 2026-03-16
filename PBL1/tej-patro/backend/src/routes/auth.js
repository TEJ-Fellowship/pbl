const express = require("express");
const passport = require("../config/passport");
const authController = require("../controllers/authController");

const router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/`);
  }
);

router.get("/me", authController.getMe);
router.get("/logout", authController.logout);

module.exports = router;
