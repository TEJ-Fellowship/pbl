const app = require('./index');
const {PORT} = require('./utils/config');
const connectDB = require('./config/connectdb');
const { connectRedis } = require('./config/redis');

app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    await connectDB();
    await connectRedis();
});

