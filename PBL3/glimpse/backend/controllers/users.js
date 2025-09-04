const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')

usersRouter.post('/', async (request, response) => {
  const { email, password, name } = request.body

  // const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, 10)

  const user = new User({
    email,
    passwordHash,
    name,
  })

  const savedUser = await user.save()

  response.status(201).json(savedUser)
})

module.exports = usersRouter