const express = require("express");
const { protect } = require("../middleware/authMiddleware");

const { registerUser, loginUser, getUserInfo } = require("../controllers/authController");
const upload = require("../middleware/uploadMiddleware");
const app = express.Router();

app.post("/register", registerUser);
app.post("/login", loginUser);
app.get("/getUser", protect, getUserInfo);

app.post('/upload', upload.single('image'), (req, res ) => {
    if(!req.file){
        return res.status(400).json({ message: "No file uploaded" });
    }
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    res.status(200).json({ message: "File uploaded successfully", fileUrl: imageUrl });
})

module.exports = app;
