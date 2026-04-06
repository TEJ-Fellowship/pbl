import "dotenv/config";
import express from "express";
import pool from "./config/db.js";
import { hybridSearch } from "./services/hybridRagService.js";

const app = express();
app.use(express.json());

app.get("/health", async (req, res) => {
  try {
    const r = await pool.query("SELECT NOW() AS now");
    res.json({ ok: true, db: true, time: r.rows[0].now });
  } catch (err) {
    res.status(503).json({ ok: false, db: false, error: err.message });
  }
});

app.post("/api/rag/search", async (req, res) => {
  try {
    const { query, keywordLimit, semanticLimit, finalLimit } = req.body || {};
    const out = await hybridSearch(query, {
      keywordLimit,
      semanticLimit,
      finalLimit,
    });
    res.json(out);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`StripeBot API http://localhost:${PORT} (GET /health, POST /api/rag/search)`);
});
