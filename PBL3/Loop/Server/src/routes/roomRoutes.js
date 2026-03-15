import express from "express";
import {
  createRoom,
  getRooms,
  getRoomById,
  joinRoomByCode,
  toggleRoomStatus,
  leaveRoom,
} from "../controllers/roomController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createRoom);
router.get("/", protect, getRooms);
router.get("/:id", protect, getRoomById);
router.post("/join", protect, joinRoomByCode);
router.patch("/:roomId/toggle", protect, toggleRoomStatus);
router.patch("/:id/leave", protect, leaveRoom);

export default router;
