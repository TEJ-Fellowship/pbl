require("dotenv").config();
const PORT = process.env.PORT;
const dbUrl = process.env.MONGODB_URL;
const dbName = process.env.MONGODB_DB;
const JWT_SECRET = process.env.JWT_SECRET;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL;
const FRONTEND_URL_DEV = process.env.FRONTEND_URL_DEV;

module.exports = {
  dbUrl,
  dbName,
  PORT,
  JWT_SECRET,
  GEMINI_API_KEY,
  FRONTEND_URL,
  FRONTEND_URL_DEV,
};
