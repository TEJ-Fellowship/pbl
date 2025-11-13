require("dotenv").config();
const { Sequelize } = require("sequelize");
const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT } = require("./config");

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: "postgres",
});

const main = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
    sequelize.close();
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

main();
