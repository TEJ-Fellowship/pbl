const {createClient} = require('redis');
const { REDIS_HOST, REDIS_PORT } = require('../utils/config');

const redisClient = createClient({
    socket: {
        host: REDIS_HOST || "localhost",
        port: REDIS_PORT || 6379,
    },
})

redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
});

redisClient.on('connect', () => {
    console.log('Redis connected successfully');
});

const connectRedis = async ()=>{
    try{
        if(!redisClient.isOpen)
            await redisClient.connect();
            console.log('Redis connected successfully');
    }catch(error){
        console.error('Redis connection error:', error);
    }
}

module.exports = {redisClient, connectRedis};