const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());
const userRouter = require('./routes/userRoutes');
const postRouter = require('./routes/postRoutes');
const feedRouter = require('./routes/feedRoutes');

app.use(express.json());

app.use('/api/users', userRouter);
app.use('/api/posts', postRouter);
app.use('/api/feed', feedRouter);

module.exports = app;
