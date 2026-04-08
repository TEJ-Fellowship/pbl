const pool = require("../config/db");

/** Get all users from the database */
const getUsers = async () => {
  const result = await pool.query("SELECT * FROM users");
  return result.rows;
};

module.exports = { getUsers };
