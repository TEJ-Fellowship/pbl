const app = require('./index');
const {PORT} = require('./utils/config');
const connectDB = require('./config/connectdb');

app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    await connectDB();
});

