/**
 * Redis Distributed Locking Utility
 * Implements distributed locks for seat reservations using Redis SETNX
 *
 * Usage:
 *   const lock = await acquireLock('seat:123:showtime:456', 300);
 *   if (lock) {
 *     try {
 *       // Critical section - do work
 *     } finally {
 *       await releaseLock('seat:123:showtime:456', lock);
 *     }
 *   }
 */

const redis = require("./redis");
const crypto = require("crypto");

/**
 * Acquire a distributed lock
 * @param {string} key - Lock key (e.g., 'seat:123:showtime:456')
 * @param {number} ttlSeconds - Time to live in seconds (default: 300 = 5 minutes)
 * @returns {Promise<string|null>} - Lock token if acquired, null if failed
 */
async function acquireLock(key, ttlSeconds = 300) {
  try {
    // Generate unique lock token (prevents releasing someone else's lock)
    const lockToken = crypto.randomUUID();
    const lockKey = `lock:${key}`;

    // Try to acquire lock using SET NX (set if not exists) with expiration
    // SET lock:seat:123:showtime:456 <token> NX EX 300
    const result = await redis.set(lockKey, lockToken, {
      NX: true, // Only set if key doesn't exist
      EX: ttlSeconds, // Expire after TTL seconds
    });

    return result === "OK" ? lockToken : null;
  } catch (error) {
    // If Redis fails, log warning but don't block (graceful degradation)
    console.warn(`Failed to acquire lock for ${key}:`, error.message);
    return null;
  }
}

/**
 * Release a distributed lock
 * @param {string} key - Lock key
 * @param {string} lockToken - Lock token returned from acquireLock
 * @returns {Promise<boolean>} - True if released successfully
 */
async function releaseLock(key, lockToken) {
  try {
    const lockKey = `lock:${key}`;

    // Use Lua script to atomically check and delete lock
    // This ensures we only delete our own lock, not someone else's
    const luaScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    const result = await redis.eval(luaScript, {
      keys: [lockKey],
      arguments: [lockToken],
    });

    return result === 1; // 1 = deleted, 0 = not our lock or already expired
  } catch (error) {
    console.warn(`Failed to release lock for ${key}:`, error.message);
    return false;
  }
}

/**
 * Atomic multi-seat locking using a single Lua Script
 * All locks are acquired atomically - either all succeed or all fail
 * Uses a "try all, release all on failure" approach
 * @param {Array<string>} seatKeys - Array of lock keys (e.g., ['seat:123:showtime:456', ...])
 * @param {number} ttlSeconds - Time to live in seconds
 * @returns {Promise<{acquired: Array<{key: string, token: string}>, failed: Array<string>}>}
 */
async function acquireLocks(seatKeys, ttlSeconds = 300) {
  if (!seatKeys || seatKeys.length === 0) {
    return { acquired: [], failed: [] };
  }

  const lockKeys = seatKeys.map((key) => `lock:${key}`);
  const tokens = seatKeys.map(() => crypto.randomUUID());

  const luaScript = `
    -- KEYS: lock keys
    -- ARGV[1]: ttl (seconds)
    -- ARGV[2..n]: tokens for each key (same index)

    local ttl = tonumber(ARGV[1])
    local tokens = {}
    for i = 2, #ARGV do
      tokens[i - 1] = ARGV[i]
    end

    -- Try to acquire all locks atomically
    -- Track which ones we successfully acquire
    local acquired = {}
    local failed = {}

    for i = 1, #KEYS do
      local result = redis.call("SET", KEYS[i], tokens[i], "NX", "EX", ttl)
      if result then
        table.insert(acquired, i)
      else
        table.insert(failed, KEYS[i])
      end
    end

    -- If any lock failed, release all acquired locks (rollback)
    if #failed > 0 then
      for _, idx in ipairs(acquired) do
        if redis.call("GET", KEYS[idx]) == tokens[idx] then
          redis.call("DEL", KEYS[idx])
        end
      end
      return {0, unpack(failed)}
    end

    -- All locks acquired successfully
    return {1}
  `;

  const args = [ttlSeconds, ...tokens];
  try {
    const result = await redis.eval(luaScript, {
      keys: lockKeys,
      arguments: args,
    });

    //success case

    if (result && result[0] === 1) {
      return {
        acquired: lockKeys.map((k, i) => ({
          key: seatKeys[i],
          token: tokens[i],
        })),
        failed: [],
      };
    }

    //failure case
    const failedKeys =
      result && result.length > 1
        ? result.slice(1).map((x) => x.replace("lock:", ""))
        : seatKeys;
    return {
      acquired: [],
      failed: failedKeys,
    };
  } catch (error) {
    console.warn(`Failed to acquire locks:`, error.message);
    return {
      acquired: [],
      failed: seatKeys,
    };
  }
}

/**
 * Release multiple locks
 * @param {Array<{key: string, token: string}>} locks - Array of lock objects
 */
async function releaseLocks(locks) {
  if (!locks || locks.length === 0) {
    return;
  }
  try {
    const keys = locks.map((l) => `lock:${l.key}`);
    const tokens = locks.map((l) => l.token);
    const luaScript = `
      local released = 0
      for i = 1, #KEYS do
        if redis.call("GET", KEYS[i]) == ARGV[i] then
          redis.call("DEL", KEYS[i])
          released = released + 1
        end
      end
      return released
    `;
    const released = await redis.eval(luaScript, {
      keys,
      arguments: tokens,
    });
    if (released < locks.length) {
      console.warn(`Released ${released} out of ${locks.length} locks`);
    }
  } catch (error) {
    console.warn(`Failed to release locks:`, error.message);
  }
}

/**
 * Check if a lock exists (without acquiring it)
 * @param {string} key - Lock key
 * @returns {Promise<boolean>} - True if lock exists
 */
async function isLocked(key) {
  try {
    const lockKey = `lock:${key}`;
    const result = await redis.exists(lockKey);
    return result === 1;
  } catch (error) {
    console.warn(`Failed to check lock for ${key}:`, error.message);
    return false;
  }
}

module.exports = {
  acquireLock,
  releaseLock,
  acquireLocks,
  releaseLocks,
  isLocked,
};
