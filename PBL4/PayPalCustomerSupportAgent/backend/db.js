const { MongoClient } = require("mongodb");
require("dotenv").config();

let client;
let db;

async function getDb() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "paypal_agent";

  if (!uri) {
    console.error("MONGODB_URI not found in .env");
    return null;
  }

  if (db) return db;

  try {
    client = new MongoClient(uri, { maxPoolSize: 5 });
    await client.connect();
    db = client.db(dbName);
    console.log("MongoDB connected");
    return db;
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    return null;
  }
}

async function logConversation(entry) {
  try {
    const database = await getDb();
    if (!database) return;

    const col = database.collection("conversations");
    await col.insertOne({
      createdAt: new Date(),
      ...entry,
    });

    console.log("Conversation logged");
  } catch (err) {
    console.error("ailed to log conversation:", err.message);
  }
}

module.exports = { getDb, logConversation };
