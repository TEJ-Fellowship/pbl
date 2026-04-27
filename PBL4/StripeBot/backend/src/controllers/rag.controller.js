const pool = require("../config/db");
const { hybridSearch } = require("../services/hybridRagService");
const { AppError } = require("../utils/AppError");
const { ERROR_CODES, RESPONSE_MESSAGES } = require("../constants/apiResponse");

const getHealth = async (req, res, next) => {
  try {
    const r = await pool.query("SELECT NOW() AS now");
    res.json({ ok: true, db: true, time: r.rows[0].now });
  } catch (err) {
    err.statusCode = 503;
    next(err);
  }
};

const handleRagSearch = async (req, res, next) => {
  try {
    const { query, keywordLimit, semanticLimit, finalLimit } = req.body || {};
    const q = typeof query === "string" ? query.trim() : "";
    if (!q) {
      return next(
        new AppError(
          400,
          ERROR_CODES.INVALID_PROMPT,
          RESPONSE_MESSAGES.INVALID_PROMPT,
        ),
      );
    }
    const out = await hybridSearch(q, {
      keywordLimit,
      semanticLimit,
      finalLimit,
    });
    res.json(out);
  } catch (err) {
    next(err);
  }
};

module.exports = { getHealth, handleRagSearch };
