const express = require("express");
const {
  registerController,
  loginController,
  logoutController,
  verifyAuthController,
} = require("../controllers/authController.js");
const auth = require("../middlewares/auth-middleware.js");

const router = express.Router();

router.post("/login", loginController);
router.post("/register", registerController);
router.post("/logout", logoutController);
router.get("/verify", auth, verifyAuthController);

module.exports = router;
