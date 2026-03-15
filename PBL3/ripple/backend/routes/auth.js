import express from "express";
const router = express.Router();

import AuthController from "../controllers/authController.js";
import { signupValidation, loginValidation } from "../validations/auth.js";
import authenticateToken from "../middlewares/auth.js";

router.post("/signup", signupValidation, AuthController.signup);
router.post("/login", loginValidation, AuthController.login);
router.post("/refresh", AuthController.refresh);
router.post("/logout", authenticateToken, AuthController.logout);
router.get("/me", authenticateToken, AuthController.me);

export default router;
