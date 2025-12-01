/**
 * Standalone script to start the payment worker
 * This can be run separately from the main server for better scalability
 * 
 * Usage: node scripts/startPaymentWorker.js
 */

require('dotenv').config();
const { connectToDatabase } = require('../utils/db');
const { initDatabase } = require('../utils/initDatabase');
const { redisClient } = require('../utils/redis');
const { startPaymentWorker } = require('../services/paymentWorker');
const { ensureTopicExists } = require('../utils/kafka');
const { NODE_ENV } = require('../utils/config');

const start = async () => {
  try {
    console.log('🚀 Starting Payment Worker...\n');

    // Connect to databases
    await connectToDatabase();
    console.log('✅ Database connected');

    // Initialize database tables
    await initDatabase();
    console.log('✅ Database initialized');

    // Verify Redis connection
    try {
      await redisClient.ping();
      console.log('✅ Redis connected');
    } catch (error) {
      console.error('❌ Redis connection failed:', error.message);
      console.error('💡 Make sure Redis is running: docker compose up -d');
      process.exit(1);
    }

    // Ensure Kafka topic exists
    try {
      await ensureTopicExists('payments', 3);
      console.log('✅ Kafka topic verified');
    } catch (error) {
      console.warn('⚠️  Kafka topic check failed:', error.message);
      console.warn('💡 Make sure Kafka is running: docker compose up -d');
    }

    // Start payment worker
    await startPaymentWorker();
    console.log('\n✅ Payment worker started successfully');
    console.log('📨 Listening for payment requests...\n');

  } catch (error) {
    console.error('❌ Failed to start payment worker:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\n🛑 Shutting down payment worker...');
  try {
    await redisClient.quit();
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

start();

