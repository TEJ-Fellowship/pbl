import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { upload, handleMulterError } from "../middleware/upload.js";
import {
  createVoiceNote,
  getUserVoiceNotes,
  getVoiceNoteById,
  updateVoiceNote,
  deleteVoiceNote,
} from "../controllers/voiceNoteController.js";

const router = express.Router();

router.use(authenticateToken);

router.post("/", upload.single("file"), handleMulterError, createVoiceNote);

router.get("/", getUserVoiceNotes);

router.get("/:id", getVoiceNoteById);

router.patch("/:id", updateVoiceNote);

router.delete("/:id", deleteVoiceNote);

export default router;
