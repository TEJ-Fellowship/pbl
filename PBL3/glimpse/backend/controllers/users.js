const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')

// usersRouter.get('/' async (re))

usersRouter.post('/', async (request, response) => {
  const { email, password, username } = request.body

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user = new User({
    email,
    passwordHash,
    username,
  })

  const savedUser = await user.save()

  response.status(201).json(savedUser)
})

module.exports = usersRouter