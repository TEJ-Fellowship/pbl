require("dotenv").config();
const PORT = process.env.PORT;
const dbUrl = process.env.MONGODB_URL;
const dbName = process.env.MONGODB_DB;
const JWT_SECRET = process.env.JWT_SECRET;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

module.exports = { dbUrl, dbName, PORT, JWT_SECRET, GEMINI_API_KEY };
