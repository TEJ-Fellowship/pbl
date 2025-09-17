import { VoiceNote } from "../models/VoiceNote.js";
import { uploadToAzure, deleteFromAzure } from "../utils/azureStorage.js";

const parseTags = (tags) => {
  try {
    const processedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
    return Array.isArray(processedTags) ? processedTags : [];
  } catch {
    return [];
  }
};

const validateAccess = (voiceNote, userId) => {
  if (!voiceNote) throw { status: 404, message: "Voice note not found" };
  if (voiceNote.user.toString() !== userId)
    throw {
      status: 403,
      message: "You don't have permission to modify this note",
    };
};

const createVoiceNote = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No audio file provided" });
    }

    const userId = req.user.id;
    const { title, tags, duration } = req.body;

    const fileBuffer = req.file.buffer;
    const fileType = req.file.mimetype;
    const uploadResult = await uploadToAzure(fileBuffer, userId, fileType);

    const newVoiceNote = new VoiceNote({
      user: userId,
      title: title || "Untitled Voice Note",
      tags: parseTags(tags),
      fileUrl: uploadResult.fileUrl,
      blobName: uploadResult.blobName,
      fileType: fileType,
      fileSize: uploadResult.fileSize,
      duration: parseInt(duration) || 0,
      visibility: "private",
    });

    await newVoiceNote.save();

    res.status(201).json({
      message: "Voice note created successfully",
      voiceNote: newVoiceNote,
    });
  } catch (error) {
    console.error("Error creating voice note:", error);
    res
      .status(500)
      .json({ message: "Failed to create voice note", error: error.message });
  }
};

const getUserVoiceNotes = async (req, res) => {
  try {
    const userId = req.user.id;

    const voiceNotes = await VoiceNote.find({ user: userId }).sort({
      createdAt: -1,
    });

    res.status(200).json(voiceNotes);
  } catch (error) {
    console.error("Error fetching voice notes:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch voice notes", error: error.message });
  }
};

const getVoiceNoteById = async (req, res) => {
  try {
    const noteId = req.params.id;
    const userId = req.user.id;

    const voiceNote = await VoiceNote.findById(noteId);

    if (!voiceNote) {
      return res.status(404).json({ message: "Voice note not found" });
    }

    if (
      voiceNote.user.toString() !== userId &&
      voiceNote.visibility !== "public"
    ) {
      return res
        .status(403)
        .json({ message: "You don't have permission to access this note" });
    }

    res.status(200).json(voiceNote);
  } catch (error) {
    console.error("Error fetching voice note:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch voice note", error: error.message });
  }
};

const updateVoiceNote = async (req, res) => {
  try {
    const noteId = req.params.id;
    const userId = req.user.id;
    const voiceNote = await VoiceNote.findById(noteId);
    validateAccess(voiceNote, userId);

    const { title, tags, visibility } = req.body;
    if (title) voiceNote.title = title;
    if (tags) voiceNote.tags = parseTags(tags);
    if (visibility) voiceNote.visibility = visibility;
    voiceNote.updatedAt = Date.now();

    await voiceNote.save();

    res.status(200).json({
      message: "Voice note updated successfully",
      voiceNote,
    });
  } catch (error) {
    console.error("Error updating voice note:", error);
    res
      .status(500)
      .json({ message: "Failed to update voice note", error: error.message });
  }
};

const deleteVoiceNote = async (req, res) => {
  try {
    const noteId = req.params.id;
    const userId = req.user.id;

    const voiceNote = await VoiceNote.findById(noteId);
    validateAccess(voiceNote, userId);

    await deleteFromAzure(voiceNote.blobName);
    await VoiceNote.findByIdAndDelete(noteId);

    res.status(200).json({ message: "Voice note deleted successfully" });
  } catch (error) {
    console.error("Error deleting voice note:", error);
    res
      .status(500)
      .json({ message: "Failed to delete voice note", error: error.message });
  }
};

export {
  createVoiceNote,
  getUserVoiceNotes,
  getVoiceNoteById,
  updateVoiceNote,
  deleteVoiceNote,
};
