const Sequelize = require("sequelize");
const { DATABASE_URL1, DATABASE_URL2, DATABASE_URL3 } = require("./config");

// Database connection options - Optimized for 1K concurrent users
// Connection pool sizing: For 1K concurrent users with proper read/write split:
// - Primary: 300 connections (handles writes, checkouts, cart operations)
// - Replicas: 150 each (handles reads, product browsing, order history)
// Total: 600 connections across 3 databases
const dbOptions = {
  dialect: "postgres",
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 300,        // Increased for 1K concurrent users (was 200)
    min: 30,         // Increased for better connection availability (was 20)
    acquire: 30000,  // 30 second timeout for acquiring connection
    idle: 10000,     // 10 second idle timeout
    evict: 1000,     // Check for idle connections every 1 second
  },
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
    // Connection keep-alive settings
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  },
  // Query timeout to prevent long-running queries from blocking
  query: {
    timeout: 10000, // 10 seconds for queries
  },
};

// PRIMARY database (Write source of truth)
// Handles: order creation, cart writes, inventory updates, payment processing
const sequelizePrimary = new Sequelize(DATABASE_URL1, dbOptions);

// REPLICA 1 (Read-only) - Optimized pool for reads
// Handles: product browsing, order history, category listings
const sequelizeReplica1 = new Sequelize(DATABASE_URL2, {
  ...dbOptions,
  pool: {
    max: 150,  // Increased for 1K users with read/write split (was 100)
    min: 15,   // Increased (was 10)
    acquire: 30000,
    idle: 10000,
    evict: 1000,
  },
  replication: false,
});

// REPLICA 2 (Read-only) - Optimized pool for reads
// Handles: product browsing, order history, category listings
const sequelizeReplica2 = new Sequelize(DATABASE_URL3, {
  ...dbOptions,
  pool: {
    max: 150,  // Increased for 1K users with read/write split (was 100)
    min: 15,   // Increased (was 10)
    acquire: 30000,
    idle: 10000,
    evict: 1000,
  },
  replication: false,
});

// Round-robin counter for read replicas
let replicaCounter = 0;
const replicas = [sequelizeReplica1, sequelizeReplica2];

/**
 * Get read replica (round-robin)
 * Optimized for load balancing across replicas
 */
const getReadReplica = () => {
  replicaCounter = (replicaCounter + 1) % replicas.length;
  return replicas[replicaCounter];
};

/**
 * Get connection pool statistics for monitoring
 */
const getPoolStats = () => {
  const primaryPool = sequelizePrimary.connectionManager.pool;
  const replica1Pool = sequelizeReplica1.connectionManager.pool;
  const replica2Pool = sequelizeReplica2.connectionManager.pool;

  return {
    primary: {
      size: primaryPool.size,
      available: primaryPool.available,
      using: primaryPool.using,
      waiting: primaryPool.waiting,
      max: primaryPool.max,
    },
    replica1: {
      size: replica1Pool.size,
      available: replica1Pool.available,
      using: replica1Pool.using,
      waiting: replica1Pool.waiting,
      max: replica1Pool.max,
    },
    replica2: {
      size: replica2Pool.size,
      available: replica2Pool.available,
      using: replica2Pool.using,
      waiting: replica2Pool.waiting,
      max: replica2Pool.max,
    },
  };
};

/**
 * Get primary database (for writes)
 */
const getPrimary = () => sequelizePrimary;

const connectToDatabase = async () => {
  try {
    // Authenticate all three database connections
    await Promise.all([
      sequelizePrimary.authenticate(),
      sequelizeReplica1.authenticate(),
      sequelizeReplica2.authenticate(),
    ]);
    console.log("✅ Connected to PRIMARY PostgreSQL database");
    console.log("✅ Connected to REPLICA 1 PostgreSQL database");
    console.log("✅ Connected to REPLICA 2 PostgreSQL database");
  } catch (err) {
    console.error("⛔ Failed to connect to the databases:", err.message);
    return process.exit(1);
  }

  return null;
};

// Legacy exports for backward compatibility
const sequelize1 = sequelizePrimary;
const sequelize2 = sequelizeReplica1;
const sequelize3 = sequelizeReplica2;

module.exports = {
  connectToDatabase,
  // Primary (write)
  sequelizePrimary,
  getPrimary,
  // Replicas (read)
  sequelizeReplica1,
  sequelizeReplica2,
  getReadReplica,
  // Monitoring
  getPoolStats,
  // Legacy exports
  sequelize1,
  sequelize2,
  sequelize3
};
