import Loop from "../models/Loop.js";

// Save Loop
export const saveLoop = async (req, res) => {
  const { roomId, imageData } = req.body;
  try {
    const doodle = await Loop.create({
      room: roomId,
      createdBy: req.user._id,
      imageData,
    });
    res.status(201).json(loop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Doodles by Room
export const getLoop = async (req, res) => {
  const { roomId } = req.params;
  try {
    const loop = await Loop.find({ room: roomId }).populate("createdBy", "username email");
    res.json(loop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
