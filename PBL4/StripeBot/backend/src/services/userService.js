import pool from "../config/db.js";

/** Get all users from the database */
export const getUsers = async () => {
  const result = await pool.query("SELECT * FROM users");
  return result.rows;
};
