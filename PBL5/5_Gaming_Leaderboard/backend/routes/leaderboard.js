const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const redisService = require("../services/redisService");
const { CDN_CACHE_TTL } = require("../util/config");
const { validateLeaderboardQuery } = require("../middleware/validation");
const { apiLimiter } = require("../middleware/rateLimiter");
const logger = require("../util/logger");

/**
 * GET /api/leaderboard/:gameMode
 * Get leaderboard for a specific game mode (offset or cursor pagination)
 *
 * Query params:
 * - type: "global" | "daily" | "weekly" (default: "global")
 * - limit: number (default: 100, max: 1000)
 * - offset: number (offset-based pagination, default: 0)
 * - cursor: string (base64 encoded cursor for cursor-based pagination)
 * - direction: "next" | "prev" (default: "next", cursor pagination only)
 */
router.get("/:gameMode", apiLimiter, validateLeaderboardQuery, async (req, res) => {
  try {
    const gameMode = parseInt(req.params.gameMode);
    const type = req.query.type || "global";
    const cursor = req.query.cursor || null;
    const direction = req.query.direction || "next";

    let limit = parseInt(req.query.limit);
    if (isNaN(limit) || limit <= 0) {
      limit = 100;
    }
    limit = Math.max(1, Math.min(limit, 1000));

    let offset = parseInt(req.query.offset);
    if (isNaN(offset) || offset < 0) {
      offset = 0;
    }
    offset = Math.max(0, offset);

    const gameModeData = await redisService.getGameMode(gameMode);
    if (!gameModeData) {
      return res.status(404).json({
        error: "Game mode not found",
        gameMode,
      });
    }

    let responseData;

    if (cursor) {
      if (direction !== "next" && direction !== "prev") {
        return res.status(400).json({
          error: "Invalid direction. Must be 'next' or 'prev'",
        });
      }

      const result = await redisService.getLeaderboardWithCursor(
        gameMode,
        type,
        limit,
        cursor,
        direction
      );

      responseData = {
        gameMode,
        gameModeName: gameModeData.name,
        type,
        pagination: {
          limit: result.pagination.limit,
          total: result.totalCount,
          hasMore: result.pagination.hasMore,
          nextCursor: result.pagination.nextCursor,
          prevCursor: result.pagination.prevCursor,
        },
        leaderboard: result.leaderboard,
      };
    } else if (type === "weekly") {
      const { leaderboard, totalCount, weekId } =
        await redisService.getWeeklyLeaderboard(gameMode, null, limit, offset);

      const hasMore = offset + limit < totalCount;
      responseData = {
        gameMode,
        gameModeName: gameModeData.name,
        type,
        weekId,
        pagination: {
          limit,
          offset,
          total: totalCount,
          hasMore,
          nextOffset: hasMore ? offset + limit : null,
          prevOffset: offset > 0 ? Math.max(0, offset - limit) : null,
        },
        leaderboard,
      };
    } else {
      const { leaderboard, totalCount } = await redisService.getLeaderboard(
        gameMode,
        type,
        limit,
        offset
      );

      const hasMore = offset + limit < totalCount;
      responseData = {
        gameMode,
        gameModeName: gameModeData.name,
        type,
        pagination: {
          limit,
          offset,
          total: totalCount,
          hasMore,
          nextOffset: hasMore ? offset + limit : null,
          prevOffset: offset > 0 ? Math.max(0, offset - limit) : null,
        },
        leaderboard,
      };
    }

    const etag = crypto
      .createHash("md5")
      .update(JSON.stringify(responseData))
      .digest("hex");

    if (req.headers["if-none-match"] === `"${etag}"`) {
      return res.status(304).end();
    }

    const cacheControl = `public, max-age=${CDN_CACHE_TTL}, s-maxage=${CDN_CACHE_TTL}`;
    res.setHeader("Cache-Control", cacheControl);
    res.setHeader("CDN-Cache-Control", cacheControl);
    res.setHeader("ETag", `"${etag}"`);
    res.setHeader("Vary", "Accept");

    res.json(responseData);
  } catch (error) {
    logger.error("Error fetching leaderboard", {
      error: error.message,
      gameMode: req.params.gameMode,
      type: req.query.type,
    });
    throw error;
  }
});

/**
 * GET /api/leaderboard/:gameMode/top100
 * Dedicated endpoint for top 100 leaderboard (optimized for CDN caching)
 * This endpoint has fixed parameters (limit=100, offset=0) for better cache hit rates
 */
router.get("/:gameMode/top100", apiLimiter, validateLeaderboardQuery, async (req, res) => {
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
    let leaderboardData;
    if (type === "weekly") {
      leaderboardData = await redisService.getWeeklyLeaderboard(gameMode, null, limit, offset);
    } else {
      leaderboardData = await redisService.getLeaderboard(gameMode, type, limit, offset);
    }
    
    const { leaderboard, totalCount } = leaderboardData;

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
    logger.error("Error fetching top 100 leaderboard", { error: error.message, gameMode });
    throw error; // Let error handler middleware handle it
  }
});

/**
 * GET /api/leaderboard/:gameMode/weekly
 * Get weekly leaderboard for a specific game mode
 */
router.get("/:gameMode/weekly", apiLimiter, validateLeaderboardQuery, async (req, res) => {
  try {
    const gameMode = parseInt(req.params.gameMode);
    const weekId = req.query.weekId || null; // Optional: specific week, defaults to current week
    let limit = parseInt(req.query.limit);
    if (isNaN(limit) || limit <= 0) {
      limit = 100;
    }
    limit = Math.max(1, Math.min(limit, 1000));
    
    let offset = parseInt(req.query.offset);
    if (isNaN(offset) || offset < 0) {
      offset = 0;
    }

    // Validate game mode
    const gameModeData = await redisService.getGameMode(gameMode);
    if (!gameModeData) {
      return res.status(404).json({
        error: "Game mode not found",
        gameMode,
      });
    }

    // Get weekly leaderboard
    const { leaderboard, totalCount, weekId: currentWeekId } = await redisService.getWeeklyLeaderboard(
      gameMode,
      weekId,
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
      type: "weekly",
      weekId: currentWeekId,
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

    // Generate ETag
    const etag = crypto
      .createHash("md5")
      .update(JSON.stringify(responseData))
      .digest("hex");

    // Check If-None-Match header
    if (req.headers["if-none-match"] === `"${etag}"`) {
      return res.status(304).end();
    }

    // Cache headers
    const cacheControl = `public, max-age=${CDN_CACHE_TTL}, s-maxage=${CDN_CACHE_TTL}`;
    res.setHeader("Cache-Control", cacheControl);
    res.setHeader("CDN-Cache-Control", cacheControl);
    res.setHeader("ETag", `"${etag}"`);
    res.setHeader("Vary", "Accept");

    res.json(responseData);
  } catch (error) {
    logger.error("Error fetching weekly leaderboard", { error: error.message, gameMode });
    throw error;
  }
});

module.exports = router;
