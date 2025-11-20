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

    if (result === "OK") {
      return lockToken; // Lock acquired
    }

    return null; // Lock already held by another process
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
 * Acquire locks for multiple seats atomically
 * Uses a "try all, release all on failure" approach
 * @param {Array<string>} seatKeys - Array of lock keys (e.g., ['seat:123:showtime:456', ...])
 * @param {number} ttlSeconds - Time to live in seconds
 * @returns {Promise<{acquired: Array<{key: string, token: string}>, failed: Array<string>}>}
 */
async function acquireLocks(seatKeys, ttlSeconds = 300) {
  const acquired = [];
  const failed = [];

  // Try to acquire all locks
  for (const key of seatKeys) {
    const token = await acquireLock(key, ttlSeconds);
    if (token) {
      acquired.push({ key, token });
    } else {
      failed.push(key);
    }
  }

  // If any lock failed, release all acquired locks (all-or-nothing)
  if (failed.length > 0) {
    for (const { key, token } of acquired) {
      await releaseLock(key, token);
    }
    return { acquired: [], failed };
  }

  return { acquired, failed: [] };
}

/**
 * Release multiple locks
 * @param {Array<{key: string, token: string}>} locks - Array of lock objects
 */
async function releaseLocks(locks) {
  const promises = locks.map(({ key, token }) => releaseLock(key, token));
  await Promise.all(promises);
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
