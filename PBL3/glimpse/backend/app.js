var cors = require('cors')
const express = require('express')
const mongoose = require('mongoose')
const config = require('./utils/config')
const logger = require('./utils/logger')
const middleware = require('./utils/middleware')
// const notesRouter = require('./controllers/note')
const usersRoutes = require('./controllers/users')
const clipsRouter = require('./controllers/clips')
// const montagesRoutes = require('./controllers/montages')
const loginRouter = require('./controllers/login')

const app = express()
app.use(cors());
logger.info('connecting to', config.MONGODB_URI)

mongoose
  .connect(config.MONGODB_URI)
  .then(() => {
    logger.info('connected to MongoDB')
  })
  .catch((error) => {
    logger.error('error connection to MongoDB:', error.message)
  })

// app.use(express.static('dist'))
app.use(express.json())
app.use(middleware.requestLogger)

app.use('/api/users', usersRoutes)
app.use('/api/login', loginRouter)
app.use('/api/clips', clipsRouter)
// app.use('/api/montages', montagesRoutes)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app