const { Sequelize } = require("sequelize");
const { DATABASE_URL } = require("./config");
const { Umzug, SequelizeStorage } = require("umzug");

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: false,
  // pool: {
  //   max: 10, // Maximum number of connections in pool
  //   min: 0, // Minimum number of connections in pool
  //   acquire: 30000, // Maximum time (ms) to wait for connection
  //   idle: 10000, // Maximum time (ms) a connection can be idle
  // },
});

const connectToDatabase = async () => {
  try {
    await sequelize.authenticate();
    await runMigrations();
    console.log("connected to the database");
  } catch (err) {
    console.log("failed to connect to the database");
    return process.exit(1);
  }
  return null;
};

const migrationConf = {
  migrations: {
    glob: "migrations/*.js",
  },
  storage: new SequelizeStorage({ sequelize, tableName: "migrations" }),
  context: sequelize.getQueryInterface(),
  logger: console,
};

const runMigrations = async () => {
  const migrator = new Umzug(migrationConf);
  const migrations = await migrator.up();
  console.log("Migrations up to date", {
    files: migrations.map((mig) => mig.name),
  });
};

const rollbackMigration = async () => {
  await sequelize.authenticate();
  const migrator = new Umzug(migrationConf);
  await migrator.down();
};

module.exports = { connectToDatabase, sequelize, rollbackMigration };
