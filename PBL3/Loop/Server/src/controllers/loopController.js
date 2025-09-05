import Doodle from "../models/Doodle.js";

// Save Doodle
export const saveDoodle = async (req, res) => {
  const { roomId, imageData } = req.body;
  try {
    const doodle = await Doodle.create({
      room: roomId,
      createdBy: req.user._id,
      imageData,
    });
    res.status(201).json(doodle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Doodles by Room
export const getDoodles = async (req, res) => {
  const { roomId } = req.params;
  try {
    const doodles = await Doodle.find({ room: roomId }).populate("createdBy", "username email");
    res.json(doodles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
