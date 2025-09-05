import express from "express";
import { saveLoop, getLoop } from "../controllers/loopController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/", protect, saveLoop);
router.get("/:roomId", protect, getLoop);

export default router;
