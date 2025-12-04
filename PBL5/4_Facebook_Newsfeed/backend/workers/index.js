require('dotenv').config();
const sequelize = require('../config/database');
const postWorker = require('./postWorker');

async function startWorkers() {
  try {
    console.log('🔌 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    console.log('🚀 Starting Kafka workers...');
    await postWorker.run();

    console.log('✅ All workers started successfully');
  } catch (error) {
    console.error('❌ Failed to start workers:', error);
    process.exit(1);
  }
}

startWorkers();