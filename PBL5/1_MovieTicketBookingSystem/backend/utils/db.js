const { Sequelize } = require("sequelize");
const { DATABASE_URL } = require("./config");
const { Umzug, SequelizeStorage } = require("umzug");

// Only create Sequelize instance if DATABASE_URL is provided (optional for Redis-only mode)
let sequelize = null;
if (DATABASE_URL) {
  sequelize = new Sequelize(DATABASE_URL, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: false,
  pool: {
    max: 10, // Maximum number of connections in pool
    min: 0, // Minimum number of connections in pool
    acquire: 30000, // Maximum time (ms) to wait for connection
    idle: 10000, // Maximum time (ms) a connection can be idle
  },
});
} else {
  // Create a dummy sequelize object for models to load (Redis-only mode)
  // Models won't actually work, but they won't crash the app
  sequelize = {
    define: () => {
      return {
        hasMany: () => {},
        belongsTo: () => {},
        hasOne: () => {},
      };
    },
    authenticate: async () => {
      throw new Error("Database not configured");
    },
    getQueryInterface: () => ({}),
  };
}

const connectToDatabase = async () => {
  // Skip database connection if DATABASE_URL is not provided (Redis-only mode)
  if (!DATABASE_URL || !sequelize) {
    console.log("⚠️  Database connection skipped (Redis-only mode)");
    return null;
  }

  try {
    await sequelize.authenticate();
    console.log("✅ Database authenticated");
    await runMigrations();
    console.log("✅ connected to the database");
  } catch (err) {
    console.error("❌ failed to connect to the database");
    console.error("Error details:", err.message);
    if (err.original) {
      console.error("Original error:", err.original.message);
    }
    // Don't exit process - allow Redis-only mode to continue
    throw err;
  }
  return null;
};

const getMigrationConf = () => {
  if (!sequelize) {
    throw new Error(
      "Sequelize not initialized. DATABASE_URL is required for migrations."
    );
  }
  return {
  migrations: {
    glob: "migrations/*.js",
  },
  storage: new SequelizeStorage({ sequelize, tableName: "migrations" }),
  context: sequelize.getQueryInterface(),
  logger: console,
  };
};

const runMigrations = async () => {
  if (!sequelize) {
    return; // Skip migrations if database is not configured
  }
  try {
    const migrationConf = getMigrationConf();
    const migrator = new Umzug(migrationConf);
    const migrations = await migrator.up();
    if (migrations.length > 0) {
      console.log("✅ Migrations applied:", {
        files: migrations.map((mig) => mig.name),
      });
    } else {
      console.log("✅ Migrations up to date");
    }
  } catch (error) {
    console.error("❌ Migration error:", error.message);
    throw error;
  }
};

const rollbackMigration = async () => {
  if (!sequelize) {
    throw new Error(
      "Sequelize not initialized. DATABASE_URL is required for rollback."
    );
  }
  await sequelize.authenticate();
  const migrationConf = getMigrationConf();
  const migrator = new Umzug(migrationConf);
  await migrator.down();
};

module.exports = {
  connectToDatabase,
  sequelize,
  rollbackMigration,
  runMigrations,
};
