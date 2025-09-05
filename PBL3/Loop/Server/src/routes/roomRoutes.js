import express from "express";
import { createRoom, getRooms, joinRoomByCode, deactivateRoom } from "../controllers/roomController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getRooms);
router.post("/", protect, createRoom);
router.post("/join", protect, joinRoomByCode);  // join via code
router.patch("/:roomId/deactivate", protect, deactivateRoom); // deactivate room

export default router;
