//controllers/clipController
const uploadClip = (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No files uploaded" });
  console.log("Uploaded File", req.file.filename);

  const clipURL = `http://localhost:5000/uploads/${req.file.filename}`;
  res.json({ success: true, url: clipURL });
};
module.exports = { uploadClip };
