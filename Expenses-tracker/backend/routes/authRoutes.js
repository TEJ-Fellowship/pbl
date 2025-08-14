const express = require('express');


//for protect 

const { protect } = require("../middlware/authMiddlware.js");

const { 
    registerUser,
    loginUser,
    getUserInfo,
} = require('../controllers/authController.js');

const upload = require("../middlware/uploadMiddleware");


const router = express.Router();

router.post('/register', registerUser);

router.post('/login', loginUser);

router.get('/getUser', protect, getUserInfo);

router.post("/upload-image", upload.single("image"), (req, res) =>{
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }
    
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${
    req.file.filename
    }`; // Construct the image URL
    res.status(200).json({ message: "Image uploaded successfully", imageUrl });
   
})

module.exports = router;