const { redis } = require("../util/db");
const crypto = require("crypto");

/**
 * Redis Service - Handles all Redis operations for leaderboards and player data
 */

// Player Operations
const getPlayer = async (playerId) => {
  const playerData = await redis.hgetall(`player:${playerId}`);
  if (!playerData || Object.keys(playerData).length === 0) {
    return null;
  }
  return {
    id: playerId,
    username: playerData.username,
    total_score: parseInt(playerData.total_score || 0),
    games_played: parseInt(playerData.games_played || 0),
    created_at: playerData.created_at,
  };
};

const createOrUpdatePlayer = async (playerId, username) => {
  const exists = await redis.exists(`player:${playerId}`);
  const pipeline = redis.pipeline();

  if (!exists) {
    // New player
    pipeline.hset(`player:${playerId}`, {
      username,
      total_score: 0,
      games_played: 0,
      created_at: new Date().toISOString(),
    });
  } else {
    // Update username if changed
    pipeline.hset(`player:${playerId}`, "username", username);
  }

  await pipeline.exec();
};

const updatePlayerScore = async (playerId, score) => {
  const pipeline = redis.pipeline();
  pipeline.hincrby(`player:${playerId}`, "total_score", score);
  pipeline.hincrby(`player:${playerId}`, "games_played", 1);
  await pipeline.exec();
};

// Leaderboard Operations
const updateGlobalLeaderboard = async (gameMode, playerId, score) => {
  await redis.zincrby(`leaderboard:${gameMode}:global`, score, playerId);
};

const updateDailyLeaderboard = async (gameMode, playerId, score) => {
  const today = new Date().toISOString().split("T")[0];
  const key = `leaderboard:${gameMode}:daily:${today}`;
  
  await redis.zincrby(key, score, playerId);
  // Set expiration (7 days)
  await redis.expire(key, 7 * 24 * 60 * 60);
};

const getLeaderboard = async (gameMode, type = "global", limit = 100, offset = 0) => {
  let key;
  if (type === "daily") {
    const today = new Date().toISOString().split("T")[0];
    key = `leaderboard:${gameMode}:daily:${today}`;
  } else {
    key = `leaderboard:${gameMode}:global`;
  }

  // Get total count of players in leaderboard
  const totalCount = await redis.zcard(key);

  // Get top players with scores (sorted descending)
  const results = await redis.zrevrange(key, offset, offset + limit - 1, "WITHSCORES");
  
  // Convert to array of {playerId, score}
  const leaderboard = [];
  for (let i = 0; i < results.length; i += 2) {
    leaderboard.push({
      playerId: results[i],
      score: parseInt(results[i + 1]),
    });
  }

  // Batch fetch usernames
  let leaderboardWithRanks = [];
  if (leaderboard.length > 0) {
    const playerIds = leaderboard.map((entry) => entry.playerId);
    const usernames = await batchGetUsernames(playerIds);

    // Combine with ranks
    leaderboardWithRanks = leaderboard.map((entry, index) => ({
      rank: offset + index + 1,
      playerId: entry.playerId,
      username: usernames[entry.playerId] || "Unknown",
      score: entry.score,
    }));
  }

  // Return both leaderboard data and total count
  return {
    leaderboard: leaderboardWithRanks,
    totalCount: totalCount || 0,
  };
};

const getPlayerRank = async (gameMode, playerId, type = "global") => {
  let key;
  if (type === "daily") {
    const today = new Date().toISOString().split("T")[0];
    key = `leaderboard:${gameMode}:daily:${today}`;
  } else {
    key = `leaderboard:${gameMode}:global`;
  }

  const rank = await redis.zrevrank(key, playerId);
  const score = await redis.zscore(key, playerId);

  if (rank === null || score === null) {
    return null;
  }

  return {
    rank: rank + 1, // 0-indexed to 1-indexed
    score: parseInt(score),
  };
};

const getPlayerScore = async (gameMode, playerId, type = "global") => {
  let key;
  if (type === "daily") {
    const today = new Date().toISOString().split("T")[0];
    key = `leaderboard:${gameMode}:daily:${today}`;
  } else {
    key = `leaderboard:${gameMode}:global`;
  }

  const score = await redis.zscore(key, playerId);
  return score ? parseInt(score) : 0;
};

// Batch operations for performance
const batchGetUsernames = async (playerIds) => {
  if (playerIds.length === 0) return {};

  const pipeline = redis.pipeline();
  playerIds.forEach((playerId) => {
    pipeline.hget(`player:${playerId}`, "username");
  });

  const results = await pipeline.exec();
  const usernames = {};

  results.forEach((result, index) => {
    if (result[1]) {
      usernames[playerIds[index]] = result[1];
    }
  });

  return usernames;
};

// Rate Limiting
const checkRateLimit = async (playerId, minIntervalSeconds = 60) => {
  const key = `player:${playerId}:last_submission`;
  const lastSubmission = await redis.get(key);

  if (lastSubmission) {
    const lastTime = new Date(lastSubmission).getTime();
    const now = Date.now();
    const elapsed = (now - lastTime) / 1000;

    if (elapsed < minIntervalSeconds) {
      return {
        allowed: false,
        remainingSeconds: Math.ceil(minIntervalSeconds - elapsed),
      };
    }
  }

  // Update last submission time
  await redis.setex(key, minIntervalSeconds, new Date().toISOString());

  return { allowed: true };
};

// Game Modes Operations
const getGameMode = async (gameModeId) => {
  const gameModeData = await redis.hget("game_modes", gameModeId);
  if (!gameModeData) {
    return null;
  }
  return JSON.parse(gameModeData);
};

const getAllGameModes = async () => {
  const gameModes = await redis.hgetall("game_modes");
  const result = [];

  for (const [id, data] of Object.entries(gameModes)) {
    result.push({
      id: parseInt(id),
      ...JSON.parse(data),
    });
  }

  return result.sort((a, b) => a.id - b.id);
};

const initializeGameModes = async () => {
  const exists = await redis.exists("game_modes");
  if (exists) {
    return; // Already initialized
  }

  const gameModes = [
    {
      id: 1,
      name: "Deathmatch",
      max_score_per_game: 15000,
      avg_game_duration_minutes: 10,
    },
    {
      id: 2,
      name: "Capture the Flag",
      max_score_per_game: 20000,
      avg_game_duration_minutes: 15,
    },
    {
      id: 3,
      name: "Raid",
      max_score_per_game: 25000,
      avg_game_duration_minutes: 20,
    },
  ];

  const pipeline = redis.pipeline();
  gameModes.forEach((mode) => {
    pipeline.hset("game_modes", mode.id, JSON.stringify(mode));
  });
  await pipeline.exec();

  console.log("✅ Game modes initialized");
};

/**
 * Check if leaderboards need to be rebuilt (Redis is empty or missing data)
 * Returns true if leaderboards should be rebuilt from Kafka
 * Optimized to use SCAN instead of KEYS for better performance
 */
const needsRebuild = async () => {
  try {
    // Check if any global leaderboards exist
    const gameModes = await getAllGameModes();
    
    if (gameModes.length === 0) {
      // Game modes not initialized, will be initialized separately
      // Check if there are any players using SCAN (non-blocking, faster)
      const hasPlayers = await checkIfPlayersExist();
      return !hasPlayers;
    }

    // Check if at least one global leaderboard has data
    for (const mode of gameModes) {
      const leaderboardKey = `leaderboard:${mode.id}:global`;
      const count = await redis.zcard(leaderboardKey);
      if (count > 0) {
        // At least one leaderboard has data, no rebuild needed
        return false;
      }
    }

    // Check if there are any players using SCAN (non-blocking, faster)
    const hasPlayers = await checkIfPlayersExist();
    
    // If no leaderboards and no players, we need to rebuild
    return !hasPlayers;
  } catch (error) {
    console.error("❌ Error checking if rebuild is needed:", error);
    // If we can't check, assume rebuild is needed (safer option)
    return true;
  }
};

/**
 * Check if any players exist using SCAN (non-blocking, much faster than KEYS)
 * Returns true if at least one player key is found
 */
const checkIfPlayersExist = async () => {
  try {
    // Use SCAN with a small cursor to quickly check if any player keys exist
    // This is much faster than KEYS and doesn't block Redis
    const stream = redis.scanStream({
      match: "player:*",
      count: 100, // Process in batches
    });

    // Set a timeout to avoid waiting too long
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Timeout")), 1000); // 1 second max
    });

    const checkPromise = new Promise((resolve) => {
      let foundPlayer = false;
      
      stream.on("data", (keys) => {
        // Filter out rate limit keys
        const playerKeys = keys.filter(key => 
          key.startsWith("player:") && !key.includes(":last_submission")
        );
        
        if (playerKeys.length > 0) {
          foundPlayer = true;
          stream.destroy(); // Stop scanning once we find a player
          resolve(true);
        }
      });

      stream.on("end", () => {
        resolve(foundPlayer);
      });

      stream.on("error", () => {
        resolve(false); // On error, assume no players (safer for rebuild)
      });
    });

    // Race between the scan and timeout
    return await Promise.race([checkPromise, timeout]);
  } catch (error) {
    // If timeout or error, assume no players exist (safer to rebuild)
    return false;
  }
};

/**
 * Encode cursor from score and playerId
 */
const encodeCursor = (score, playerId) => {
  const data = JSON.stringify({ score, playerId });
  return Buffer.from(data).toString("base64url");
};

/**
 * Decode cursor to score and playerId
 */
const decodeCursor = (cursor) => {
  try {
    const data = Buffer.from(cursor, "base64url").toString("utf-8");
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
};

/**
 * Get leaderboard with cursor-based pagination
 * @param {number} gameMode - Game mode ID
 * @param {string} type - "global" | "daily"
 * @param {number} limit - Number of results (default: 100, max: 1000)
 * @param {string|null} cursor - Base64 encoded cursor (score:playerId)
 * @param {string} direction - "next" | "prev" (default: "next")
 */
const getLeaderboardWithCursor = async (
  gameMode,
  type = "global",
  limit = 100,
  cursor = null,
  direction = "next"
) => {
  let key;
  if (type === "daily") {
    const today = new Date().toISOString().split("T")[0];
    key = `leaderboard:${gameMode}:daily:${today}`;
  } else {
    key = `leaderboard:${gameMode}:global`;
  }

  // Get total count
  const totalCount = await redis.zcard(key);

  // Validate and clamp limit
  const clampedLimit = Math.min(Math.max(parseInt(limit) || 100, 1), 1000);
  const queryLimit = clampedLimit + 1; // Fetch one extra to check if there's more

  let results = [];
  let startRank = 0;

  if (!cursor) {
    // First page - get top players
    results = await redis.zrevrange(key, 0, queryLimit - 1, "WITHSCORES");
    startRank = 0;
  } else {
    // Decode cursor
    const cursorData = decodeCursor(cursor);
    if (!cursorData) {
      throw new Error("Invalid cursor");
    }

    const { score: cursorScore, playerId: cursorPlayerId } = cursorData;

    if (direction === "next") {
      // Get players with score < cursorScore (lower scores = lower ranks)
      // Use ZREVRANGEBYSCORE to get players below the cursor
      results = await redis.zrevrangebyscore(
        key,
        `(${cursorScore}`, // Less than cursor score (exclusive)
        "-inf", // All the way to bottom
        "WITHSCORES",
        "LIMIT",
        0,
        queryLimit
      );

      // Get rank of cursor player to calculate start rank
      const cursorRank = await redis.zrevrank(key, cursorPlayerId);
      if (cursorRank !== null) {
        startRank = cursorRank + 1; // Start after cursor
      }
    } else {
      // Previous page - get players with score > cursorScore (higher scores = higher ranks)
      results = await redis.zrevrangebyscore(
        key,
        "+inf", // All the way to top
        `(${cursorScore}`, // Greater than cursor score (exclusive)
        "WITHSCORES",
        "LIMIT",
        0,
        queryLimit
      );

      // Reverse results for prev direction (we want descending order)
      results = results.reverse();

      // Calculate start rank
      const cursorRank = await redis.zrevrank(key, cursorPlayerId);
      if (cursorRank !== null) {
        startRank = Math.max(0, cursorRank - clampedLimit);
      }
    }
  }

  // Check if there are more results
  const hasMore = results.length > clampedLimit;
  if (hasMore) {
    results = results.slice(0, clampedLimit);
  }

  // Convert to array of {playerId, score}
  const leaderboard = [];
  for (let i = 0; i < results.length; i += 2) {
    leaderboard.push({
      playerId: results[i],
      score: parseInt(results[i + 1]),
    });
  }

  // Batch fetch usernames
  let leaderboardWithRanks = [];
  if (leaderboard.length > 0) {
    const playerIds = leaderboard.map((entry) => entry.playerId);
    const usernames = await batchGetUsernames(playerIds);

    // Calculate actual ranks
    const firstPlayerId = leaderboard[0].playerId;
    const firstRank = await redis.zrevrank(key, firstPlayerId);
    const actualStartRank = firstRank !== null ? firstRank + 1 : startRank + 1;

    // Combine with ranks
    leaderboardWithRanks = leaderboard.map((entry, index) => ({
      rank: actualStartRank + index,
      playerId: entry.playerId,
      username: usernames[entry.playerId] || "Unknown",
      score: entry.score,
    }));
  }

  // Generate cursors
  let nextCursor = null;
  let prevCursor = null;

  if (leaderboard.length > 0) {
    const lastEntry = leaderboard[leaderboard.length - 1];
    const firstEntry = leaderboard[0];

    if (hasMore || (cursor && direction === "next")) {
      nextCursor = encodeCursor(lastEntry.score, lastEntry.playerId);
    }

    if (cursor || (startRank > 0 && direction === "prev")) {
      prevCursor = encodeCursor(firstEntry.score, firstEntry.playerId);
    }
  }

  return {
    leaderboard: leaderboardWithRanks,
    totalCount: totalCount || 0,
    pagination: {
      hasMore,
      nextCursor,
      prevCursor,
      limit: clampedLimit,
    },
  };
};

module.exports = {
  // Player operations
  getPlayer,
  createOrUpdatePlayer,
  updatePlayerScore,

  // Leaderboard operations
  updateGlobalLeaderboard,
  updateDailyLeaderboard,
  getLeaderboard, // Keep for backward compatibility
  getLeaderboardWithCursor, // New cursor-based method
  getPlayerRank,
  getPlayerScore,

  // Rate limiting
  checkRateLimit,

  // Game modes
  getGameMode,
  getAllGameModes,
  initializeGameModes,

  // Recovery
  needsRebuild,
};

