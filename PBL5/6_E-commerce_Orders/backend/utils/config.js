require("dotenv").config();

module.exports = {
  DATABASE_URL1: process.env.DATABASE_URL1,
  DATABASE_URL2: process.env.DATABASE_URL2,
  DATABASE_URL3: process.env.DATABASE_URL3,
  PORT: process.env.PORT || 3001,
  SECRET: process.env.SECRET || "my-secret",
};
