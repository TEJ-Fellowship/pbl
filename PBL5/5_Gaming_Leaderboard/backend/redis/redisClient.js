// import { createClient } from 'redis';
const { createClient } = require('redis');
const { PASSWORD } = require('../util/config');

const client = createClient({
  username: 'default',
  password: PASSWORD,
  socket: {
      host: 'redis-10155.c212.ap-south-1-1.ec2.cloud.redislabs.com',
      port: 10155
  }
});

// client.on('error', err => console.log('Redis Client Error', err));

// await client.connect();

module.exports = {
  client,
};