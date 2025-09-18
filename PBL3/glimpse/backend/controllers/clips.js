// const jwt = require('jsonwebtoken')
// const clipsclipsR= require('express').Router()
// const User = require('../models/user')
// const Clip = require("../models/clip")

// const getTokenFrom = request => {
//   const authorization = request.get('authorization')
//   if (authorization && authorization.startsWith('Bearer ')) {
//     return authorization.replace('Bearer ', '')
//   }
//   return null
// }

// clipsRouter.post('/', async (request, response) => {
//   const {videoUrl,caption,thumbnailUrl,downloadUrl} = request.body

//   const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)
//   if (!decodedToken.id) {
//     return response.status(401).json({ error: 'token invalid' })
//   }
//   const user = await User.findById(decodedToken.id)

//   if (!user) {
//     return response.status(400).json({ error: 'UserId missing or not valid' })
//   }

//   const clip = new Clip({
//     videoUrl,caption,thumbnailUrl,downloadUrl,
//     user: user.id
//   })

//   const savedClip = await clip.save()
//   user.clips = user.clips.concat(savedClip.id)
//   await user.save()

//   response.status(201).json(savedClip)
// })

// module.exports = clipsRouter;


// server/routes/glimpses.js
// const express = require("express");
// const clipsRouter = express.Router();
// const Clip = require("../models/clip");
// const auth = require("../middleware/authMiddleware");

// // Save glimpse (user required)
// clipsRouter.post("/", auth, async (req, res) => {
//   try {
//     const { videoUrl, publicId } = req.body;

//     if (!videoUrl || !publicId) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     const clip = new clip({
//       videoUrl,
//       publicId,
//       user: req.user._id, // 🔥 associate with logged-in user
//     });

//     await clip.save();

//     res.status(201).json(clip);
//   } catch (err) {
//     console.error("Error saving glimpse:", err);
//     res.status(500).json({ error: "Failed to save glimpse" });
//   }
// });

// // Fetch user’s glimpses
// clipsRouter.get("/my", auth, async (req, res) => {
//   try {
//     const clip = await Clip.find({ user: req.user._id }).sort({ createdAt: -1 });
//     res.json(clip);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to fetch clip" });
//   }
// });

// module.exports = clipsRouter;

// server/routes/glimpses.js
const express = require("express");
const clipsRouter = express.Router();
const Clip = require("../models/clip");

// Save glimpse metadata
clipsRouter.get('/', async (req, res, next) => {
  try{
    const clips = await Clip.find({})
    res.json(clips)
  } catch (error) {
    next(error)
  }
})

clipsRouter.post("/", async (req, res) => {
  try {
    const { videoUrl, publicId } = req.body;
    const clip = new Clip({ videoUrl, publicId, createdAt: new Date() });
    await clip.save();
    res.status(201).json(clip);
  } catch (err) {
    res.status(500).json({ error: "Failed to save glimpse" });
  }
});

module.exports = clipsRouter
