//routes/clips
const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");
const { uploadClip } = require("../controllers/clipController");

router.post("/", upload.single("audio"), uploadClip);
module.exports = router;
