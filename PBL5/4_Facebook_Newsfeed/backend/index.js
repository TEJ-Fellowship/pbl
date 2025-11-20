const express = require('express');
const app = express();

const userRouter = require('./routes/userRoutes');
const postRouter = require('./routes/postRoutes');

app.use(express.json());

app.use('/api/users', userRouter);
app.use('/api/posts', postRouter);
// app.use('/api/feed', feedRouter);


module.exports = app;
