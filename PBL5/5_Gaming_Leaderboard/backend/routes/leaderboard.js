const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const redisService = require("../services/redisService");
const { CDN_CACHE_TTL } = require("../util/config");

/**
 * GET /api/leaderboard/:gameMode
 * Get leaderboard for a specific game mode
 *
 * Query params:
 * - type: "global" | "daily" (default: "global")
 * - limit: number (default: 100, max: 1000)
 * - offset: number (default: 0)
 */
router.get("/:gameMode", async (req, res) => {
  try {
    const gameMode = parseInt(req.params.gameMode);
    const type = req.query.type || "global";

    // Parse and validate limit parameter
    // Handle NaN, negative values, and ensure it's between 1 and 1000
    let limit = parseInt(req.query.limit);
    if (isNaN(limit) || limit <= 0) {
      limit = 100; // Default to 100 if invalid or missing
    }
    limit = Math.max(1, Math.min(limit, 1000)); // Clamp between 1 and 1000

    // Parse and validate offset parameter
    let offset = parseInt(req.query.offset);
    if (isNaN(offset) || offset < 0) {
      offset = 0; // Default to 0 if invalid or negative
    }
    offset = Math.max(0, offset); // Ensure non-negative

    // Validate game mode
    const gameModeData = await redisService.getGameMode(gameMode);
    if (!gameModeData) {
      return res.status(404).json({
        error: "Game mode not found",
        gameMode,
      });
    }

    // Get leaderboard from Redis
    const { leaderboard, totalCount } = await redisService.getLeaderboard(
      gameMode,
      type,
      limit,
      offset
    );

    // Calculate pagination metadata
    const hasMore = offset + limit < totalCount;
    const nextOffset = hasMore ? offset + limit : null;
    const prevOffset = offset > 0 ? Math.max(0, offset - limit) : null;

    const responseData = {
      gameMode,
      gameModeName: gameModeData.name,
      type,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore,
        nextOffset,
        prevOffset,
      },
      leaderboard,
    };

    // Generate ETag for conditional requests
    const etag = crypto
      .createHash("md5")
      .update(JSON.stringify(responseData))
      .digest("hex");

    // Check If-None-Match header for 304 Not Modified
    if (req.headers["if-none-match"] === `"${etag}"`) {
      return res.status(304).end();
    }

    // Set cache headers for CDN
    const cacheControl = `public, max-age=${CDN_CACHE_TTL}, s-maxage=${CDN_CACHE_TTL}`;
    res.setHeader("Cache-Control", cacheControl);
    res.setHeader("CDN-Cache-Control", cacheControl); // Some CDNs use this
    res.setHeader("ETag", `"${etag}"`);
    res.setHeader("Vary", "Accept"); // Vary by Accept header

    res.json(responseData);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

/**
 * GET /api/leaderboard/:gameMode/top100
 * Dedicated endpoint for top 100 leaderboard (optimized for CDN caching)
 * This endpoint has fixed parameters (limit=100, offset=0) for better cache hit rates
 */
router.get("/:gameMode/top100", async (req, res) => {
  try {
    const gameMode = parseInt(req.params.gameMode);
    const type = req.query.type || "global";

    // Validate game mode
    const gameModeData = await redisService.getGameMode(gameMode);
    if (!gameModeData) {
      return res.status(404).json({
        error: "Game mode not found",
        gameMode,
      });
    }

    // Fixed limit of 100 for top 100 endpoint
    const limit = 100;
    const offset = 0;

    // Get leaderboard from Redis
    const { leaderboard, totalCount } = await redisService.getLeaderboard(
      gameMode,
      type,
      limit,
      offset
    );

    const responseData = {
      gameMode,
      gameModeName: gameModeData.name,
      type,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: totalCount > 100,
        nextOffset: totalCount > 100 ? 100 : null,
        prevOffset: null,
      },
      leaderboard,
    };

    // Generate ETag
    const etag = crypto
      .createHash("md5")
      .update(JSON.stringify(responseData))
      .digest("hex");

    // Check If-None-Match header
    if (req.headers["if-none-match"] === `"${etag}"`) {
      return res.status(304).end();
    }

    // Aggressive caching for top 100 endpoint
    const cacheControl = `public, max-age=${CDN_CACHE_TTL}, s-maxage=${CDN_CACHE_TTL}`;
    res.setHeader("Cache-Control", cacheControl);
    res.setHeader("CDN-Cache-Control", cacheControl);
    res.setHeader("ETag", `"${etag}"`);
    res.setHeader("Vary", "Accept");

    res.json(responseData);
  } catch (error) {
    console.error("Error fetching top 100 leaderboard:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

module.exports = router;
