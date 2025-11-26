import express from "express";
import dotenv from "dotenv";
import {
  sequelize,
  initializeCassandra,
  cassandraClient,
} from "./config/db.js";
import { initializeSchema, KEYSPACE } from "./config/cassandra-schema.js";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import "./models/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Instagram Feed API is running!" });
});

// Helper endpoint to view Cassandra tables
app.get("/api/cassandra/tables", async (req, res) => {
  try {
    const query = `
      SELECT table_name 
      FROM system_schema.tables 
      WHERE keyspace_name = ?
    `;
    const result = await cassandraClient.execute(query, [KEYSPACE], {
      prepare: true,
    });

    const tables = result.rows.map((row) => row.table_name);

    res.json({
      success: true,
      keyspace: KEYSPACE,
      tables,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching tables",
      error: error.message,
    });
  }
});

// Helper endpoint to view data from a specific table
app.get("/api/cassandra/tables/:tableName", async (req, res) => {
  try {
    const { tableName } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const query = `SELECT * FROM ${KEYSPACE}.${tableName} LIMIT ?`;
    const result = await cassandraClient.execute(query, [limit], {
      prepare: true,
    });

    const rows = result.rows.map((row) => {
      const obj = {};
      row.keys().forEach((key) => {
        const value = row.get(key);
        // Convert UUID to string for JSON serialization
        obj[key] = value instanceof types.Uuid ? value.toString() : value;
      });
      return obj;
    });

    res.json({
      success: true,
      keyspace: KEYSPACE,
      table: tableName,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching table data",
      error: error.message,
    });
  }
});

async function startServer() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: false });
    await initializeCassandra();
    await initializeSchema();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Unable to start server:", error);
    process.exit(1);
  }
}

startServer();
