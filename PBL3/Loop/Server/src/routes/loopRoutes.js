import express from "express";
import { saveLoop, getLoop, getAllLoops } from "../controllers/loopController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/", protect, saveLoop);
router.get("/", protect, getAllLoops);       // new: get all loops
router.get("/:roomId", protect, getLoop);

export default router;
