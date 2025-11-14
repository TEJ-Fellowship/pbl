const express = require('express');
const { PORT } = require('./utils/config');
const app = express();
const userRouter = require('./routes/userRoutes');
const postRouter = require('./routes/postRoutes');

app.use(express.json());

app.use('/api/users', userRouter);
app.use('/api/posts', postRouter);




app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});