import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  getAllUsers,
  sendFriendRequest,
  respondToFriendRequest,
  getFriendRequests,
  getFriends
} from "../controllers/friendController.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/users", getAllUsers);
router.post("/request", sendFriendRequest);
router.post("/respond", respondToFriendRequest);
router.get("/requests", getFriendRequests);
router.get("/", getFriends);

export default router;