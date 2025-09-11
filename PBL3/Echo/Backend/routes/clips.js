//routes/clips
const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");
const { uploadClip } = require("../controllers/clipController");
const { authMiddleWare } = require("../utils/middleware");

router.post("/", authMiddleWare, upload.single("audio"), uploadClip); //order matters
module.exports = router;
