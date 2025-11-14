import express from "express";
import { healthController } from "../controllers/healthController.js";

const router = express.Router();

// Health check endpoint
router.get("/", healthController.getHealth);

// Detailed system status
router.get("/status", healthController.getStatus);

export default router;
