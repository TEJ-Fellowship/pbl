const Sequelize = require("sequelize");
const { DATABASE_URL1, DATABASE_URL2, DATABASE_URL3 } = require("./config");

// Database connection options
const dbOptions = {
  dialect: "postgres",
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 20,
    min: 5,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
};

// PRIMARY database (Write source of truth)
const sequelizePrimary = new Sequelize(DATABASE_URL1, dbOptions);

// REPLICA 1 (Read-only)
const sequelizeReplica1 = new Sequelize(DATABASE_URL2, {
  ...dbOptions,
  replication: false, // Single connection for read
});

// REPLICA 2 (Read-only)
const sequelizeReplica2 = new Sequelize(DATABASE_URL3, {
  ...dbOptions,
  replication: false,
});

// Round-robin counter for read replicas
let replicaCounter = 0;
const replicas = [sequelizeReplica1, sequelizeReplica2];

/**
 * Get read replica (round-robin)
 */
const getReadReplica = () => {
  replicaCounter = (replicaCounter + 1) % replicas.length;
  return replicas[replicaCounter];
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
  // Legacy exports
  sequelize1,
  sequelize2,
  sequelize3
};
