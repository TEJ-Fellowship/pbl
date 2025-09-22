import express from "express";
import notificationController from "../controllers/notificationController.js";
import authenticateToken from "../middlewares/auth.js";

const router = express.Router();

router.get(
  "/notifications",
  authenticateToken,
  notificationController.getNotifications
);
router.delete(
  "/notifications/delete",
  authenticateToken,
  notificationController.deleteAllNotifications
);

export default router;
