// Redis configuration

import Redis from 'ioredis';
import { REDIS_PORT, REDIS_PASSWORD, REDIS_USERNAME, REDIS_HOST } from './index.js';

const redis = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
    username: REDIS_USERNAME,
})

export default redis;