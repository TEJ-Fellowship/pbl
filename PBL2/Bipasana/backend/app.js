require("dotenv").config();

const express=require('express');
const mongoose=require('mongoose');
const config=require('./utils/config.js')
const logger=require('./utils/logger.js')
const middleware=require('./utils/middleware.js')
const usersRouter=require('./controllers/users.js')
const journalRouter=require('./controllers/journals.js')
const loginRouter=require('./controllers/login.js')
const cors = require("cors");
const app=express()
app.use(express.json({ limit: '10mb' })); // or higher if needed
app.use(express.urlencoded({ limit: '10mb', extended: true }));
logger.info('connecting to',config.MONGODB_URL);
app.use(cors());
mongoose.connect(config.MONGODB_URL)
.then(()=>{
    logger.info('Connected to MongoDB')
}).catch((error)=>{
    logger.error('error connection to MongoDb:',error.message)
})
app.use(express.json())
app.use(middleware.requestLogger)
app.use('/api/users',usersRouter)
app.use('/api/journals',journalRouter)
app.use('/api/login',loginRouter)
app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)
module.exports=app