// Entry point (HTTP + WS + Kafka consumers)
import { connectToDatabase } from './config/postgres.js';

// Initialize database connection
const startServer = async () => {
  try {
    // Connect to PostgreSQL database
    await connectToDatabase();
    console.log('Database initialized successfully');

    // TODO: Initialize Express server
    // TODO: Initialize WebSocket server
    // TODO: Initialize Kafka consumers

    console.log('Server started successfully');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
