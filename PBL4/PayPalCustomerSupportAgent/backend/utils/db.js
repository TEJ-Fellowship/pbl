const { MongoClient } = require("mongodb");

let client = null;
let db = null;

async function getDb() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "paypal_agent";
  if (!uri) return null;
  if (db) return db;
  client = new MongoClient(uri, { maxPoolSize: 5 });
  await client.connect();
  db = client.db(dbName);
  return db;
}

async function logConversation(entry) {
  try {
    const database = await getDb();
    if (!database) return; // no-op if Mongo not configured
    const col = database.collection("conversations");
    await col.insertOne({
      createdAt: new Date(),
      ...entry,
    });
  } catch (_) {
    // swallow logging errors
  }
}

module.exports = { getDb, logConversation };


