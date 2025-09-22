import express from "express";
import { createRoom, getRooms,getRoomById, joinRoomByCode, toggleRoomStatus } from "../controllers/roomController.js";
import { protect } from "../middleware/authMiddleware.js"; // assuming JWT middleware

const router = express.Router();

router.post("/", protect, createRoom);
router.get("/", protect, getRooms);
router.get("/:id", protect, getRoomById);
router.post("/join", protect, joinRoomByCode);
router.patch("/:roomId/toggle", protect, toggleRoomStatus);


export default router;
