import express from "express";
import { saveDoodle, getDoodles } from "../controllers/doodleController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/", protect, saveDoodle);
router.get("/:roomId", protect, getDoodles);

export default router;
