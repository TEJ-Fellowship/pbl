import { signup, signin } from "../controllers/AuthController.js";
import {
  signupValidation,
  signinValidation,
} from "../middlewares/AuthValidation.js";
import { Router } from "express";

const router = Router();

router.post("/signin", signinValidation, signin);
router.post("/signup", signupValidation, signup);

export default router;
