const Sequelize = require("sequelize");
const { DATABASE_URL1, DATABASE_URL2, DATABASE_URL3 } = require("./config");

// Database connection options - Optimized for high load (500+ VUs)
// Connection pool sizing: For high concurrent load with proper read/write split:
// - Primary: 750 connections (handles writes, checkouts, cart operations)
// - Replicas: 400 each (handles reads, product browsing, order history)
// Total: 1550 connections across 3 databases
const dbOptions = {
  dialect: "postgres",
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 750,        // Increased for high load scenarios (was 500)
    min: 100,        // Increased for better connection availability (was 50)
    acquire: 90000,  // Increased to 90 seconds for connection acquire timeout (was 60)
    idle: 30000,     // Increased to 30 seconds idle timeout (was 20)
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
    timeout: 60000, // Increased to 60 seconds for queries under high load (was 30)
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
    max: 400,  // Increased for high load scenarios (was 250)
    min: 60,   // Increased for better availability (was 30)
    acquire: 90000,  // Increased to 90 seconds (was 60)
    idle: 30000,      // Increased to 30 seconds (was 20)
    evict: 1000,
  },
  replication: false,
});

// REPLICA 2 (Read-only) - Optimized pool for reads
// Handles: product browsing, order history, category listings
const sequelizeReplica2 = new Sequelize(DATABASE_URL3, {
  ...dbOptions,
  pool: {
    max: 400,  // Increased for high load scenarios (was 250)
    min: 60,   // Increased for better availability (was 30)
    acquire: 90000,  // Increased to 90 seconds (was 60)
    idle: 30000,      // Increased to 30 seconds (was 20)
    evict: 1000,
  },
  replication: false,
});

// Round-robin counter for read replicas
let replicaCounter = 0;
const replicas = [sequelizeReplica1, sequelizeReplica2];

// Circuit breaker state
const circuitBreakerState = {
  primary: { open: false, failures: 0, lastFailure: 0 },
  replica1: { open: false, failures: 0, lastFailure: 0 },
  replica2: { open: false, failures: 0, lastFailure: 0 },
};

// Circuit breaker thresholds - Less aggressive for high load scenarios
// Increased threshold to prevent premature circuit opening under load
const CIRCUIT_BREAKER_THRESHOLD = 25; // Open after 25 consecutive failures (was 10)
const CIRCUIT_BREAKER_RESET_TIME = 15000; // Reset after 15 seconds (was 30) - faster recovery

/**
 * Check if circuit breaker should allow request
 */
const checkCircuitBreaker = (dbType) => {
  const state = circuitBreakerState[dbType];
  if (!state.open) return true;
  
  // Check if enough time has passed to try again
  if (Date.now() - state.lastFailure > CIRCUIT_BREAKER_RESET_TIME) {
    state.open = false;
    state.failures = 0;
    return true;
  }
  return false;
};

/**
 * Record circuit breaker failure
 */
const recordCircuitBreakerFailure = (dbType) => {
  const state = circuitBreakerState[dbType];
  state.failures++;
  state.lastFailure = Date.now();
  
  if (state.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    state.open = true;
    console.error(`🚨 Circuit breaker OPEN for ${dbType} - too many failures`);
  }
};

/**
 * Record circuit breaker success
 */
const recordCircuitBreakerSuccess = (dbType) => {
  const state = circuitBreakerState[dbType];
  state.failures = 0;
  if (state.open) {
    state.open = false;
    console.log(`✅ Circuit breaker CLOSED for ${dbType} - connection recovered`);
  }
};

/**
 * Get read replica (round-robin) with circuit breaker check
 * Optimized for load balancing across replicas
 */
const getReadReplica = () => {
  // Try both replicas, prefer the one with closed circuit breaker
  const replica1Available = checkCircuitBreaker('replica1');
  const replica2Available = checkCircuitBreaker('replica2');
  
  if (!replica1Available && !replica2Available) {
    // Both circuit breakers open, use primary as fallback
    console.warn('⚠️  Both replicas circuit breakers open, using primary as fallback');
    return sequelizePrimary;
  }
  
  if (!replica1Available) return sequelizeReplica2;
  if (!replica2Available) return sequelizeReplica1;
  
  // Both available, use round-robin
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
  // Circuit breaker
  checkCircuitBreaker,
  recordCircuitBreakerFailure,
  recordCircuitBreakerSuccess,
  // Legacy exports
  sequelize1,
  sequelize2,
  sequelize3
};
