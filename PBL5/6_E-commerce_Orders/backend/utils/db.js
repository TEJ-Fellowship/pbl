const Sequelize = require("sequelize");
const { DATABASE_URL1, DATABASE_URL2, DATABASE_URL3 } = require("./config");

// Create three separate Sequelize instances for three PostgreSQL databases
const sequelize1 = new Sequelize(DATABASE_URL1, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

const sequelize2 = new Sequelize(DATABASE_URL2, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

const sequelize3 = new Sequelize(DATABASE_URL3, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

const connectToDatabase = async () => {
  try {
    // Authenticate all three database connections
    await Promise.all([
      sequelize1.authenticate(),
      sequelize2.authenticate(),
      sequelize3.authenticate(),
    ]);
    console.log("✅ Connected to all three PostgreSQL databases");
  } catch (err) {
    console.log("⛔ Failed to connect to the databases:", err.message);
    return process.exit(1);
  }

  return null;
};

module.exports = { connectToDatabase, sequelize1, sequelize2, sequelize3 };
