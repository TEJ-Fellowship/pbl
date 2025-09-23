import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { upload, handleMulterError } from "../middleware/upload.js";
import {
  createVoiceNote,
  getUserVoiceNotes,
  getVoiceNoteById,
  updateVoiceNote,
  deleteVoiceNote,
  transcribeVoiceNote,
} from "../controllers/voiceNoteController.js";

const router = express.Router();

router.use(authenticateToken);

router.post("/", upload.single("file"), handleMulterError, createVoiceNote);

router.get("/", getUserVoiceNotes);

router.get("/:id", getVoiceNoteById);

router.patch("/:id", updateVoiceNote);

router.post("/:id/transcribe", transcribeVoiceNote);

router.get("/test-assemblyai", async (req, res) => {
  try {
    const { submitTranscription, getTranscriptionResult } = await import(
      "../utils/assemblyAI.js"
    );
    const transcriptId = await submitTranscription(testUrl);

    res.json({
      success: true,
      message: "AssemblyAI connection test successful",
      transcriptId: transcriptId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "AssemblyAI connection test failed",
      error: error.message,
    });
  }
});

router.delete("/:id", deleteVoiceNote);

export default router;
