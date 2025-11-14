const express = require('express');
const { PORT } = require('./utils/config');
const sequelize = require('./config/database');
const app = express();

const userRouter = require('./routes/userRoutes');
const postRouter = require('./routes/postRoutes');
const User = require('./models/user');

app.use(express.json());

app.use('/api/users', userRouter);
app.use('/api/posts', postRouter);

// Sync database
sequelize.sync({ alter: true }).then(() => {
  console.log('Database synced successfully');
}).catch((error) => {
  console.error('Error syncing database:', error);
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});