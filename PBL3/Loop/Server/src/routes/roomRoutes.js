import express from "express";
import { createRoom, getRooms, joinRoomByCode, deactivateRoom } from "../controllers/roomController.js";
import { protect } from "../middleware/authMiddleware.js"; // assuming JWT middleware

const router = express.Router();

router.post("/", protect, createRoom);
router.get("/", protect, getRooms);
router.post("/join", protect, joinRoomByCode);
router.patch("/:roomId/deactivate", protect, deactivateRoom);

export default router;
