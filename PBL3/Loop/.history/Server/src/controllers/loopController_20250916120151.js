import Loop from "../models/Loop.js";

// Save a loop to backend
export const saveLoop = async (req, res) => {
  const { roomId, imageData } = req.body;

  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  try {
    const loop = await Loop.create({
      room: roomId,
      creator: req.user._id,
      finalImage: imageData,
    });

    res.status(201).json(loop);
  } catch (error) {
    console.error("SaveLoop error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get loops by room
export const getLoop = async (req, res) => {
  const { roomId } = req.params;

  try {
    const loops = await Loop.find({ room: roomId }).populate("creator", "username email");
    res.json(loops);
  } catch (error) {
    console.error("GetLoop error:", error);
    res.status(500).json({ message: error.message });
  }
};
