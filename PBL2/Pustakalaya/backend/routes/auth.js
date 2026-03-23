const express = require("express");
const passport = require("../config/passport");
const authController = require("../controllers/authController");

const router = express.Router();

router.get("/google", passport.authenticate("google"));

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=true&message=Authentication failed`,
    session: true,
  }),
  (req, res) => {
    res.redirect(`${process.env.FRONTEND_URL}/`);
  },
);

router.get("/me", authController.getMe);
router.get("/logout", authController.logout);

module.exports = router;
