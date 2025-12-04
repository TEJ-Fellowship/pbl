const app = require('./index');
const {PORT} = require('./utils/config');
const connectDB = require('./config/connectdb');
const { connectRedis } = require('./config/redis');
const kafkaProducer = require('./services/kafkaProducer');
const { createTopicsIfNotExist } = require('./utils/kafkaTopics');

app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    await connectDB();
    await connectRedis();
    try{
        await kafkaProducer.connect();
        
        console.log('✅ Kafka Producer connected');
        await createTopicsIfNotExist();
        console.log('✅ Kafka topics created');
    } catch (error) {
        console.error('⚠️ Kafka Producer connection failed, continuing without Kafka:', error);
    }
});

