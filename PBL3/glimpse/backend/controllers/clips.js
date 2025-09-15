const jwt = require('jsonwebtoken')
const clipsRouter = require('express').Router()
const User = require('../models/user')
const Clip = require("../models/clip")

const getTokenFrom = request => {
  const authorization = request.get('authorization')
  if (authorization && authorization.startsWith('Bearer ')) {
    return authorization.replace('Bearer ', '')
  }
  return null
}

clipsRouter.post('/', async (request, response) => {
  const {videoUrl,caption,thumbnailUrl,downloadUrl} = request.body

  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' })
  }
  const user = await User.findById(decodedToken.id)

  if (!user) {
    return response.status(400).json({ error: 'UserId missing or not valid' })
  }

  const clip = new Clip({
    videoUrl,caption,thumbnailUrl,downloadUrl,
    user: user.id
  })

  const savedClip = await clip.save()
  user.clips = user.clips.concat(savedClip.id)
  await user.save()

  response.status(201).json(savedClip)
})

module.exports = clipsRouter;