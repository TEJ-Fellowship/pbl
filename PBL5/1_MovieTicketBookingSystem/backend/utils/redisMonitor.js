/**
 * Redis Memory Monitoring Utility
 * Tracks Redis memory usage and health metrics
 */

const redis = require("./redis");

/**
 * Get Redis memory information
 * @returns {Promise<Object>} Memory stats
 */
async function getMemoryInfo() {
  try {
    if (!redis.isReady) {
      return {
        error: "Redis not ready",
        available: false,
      };
    }

    // Get memory info from Redis
    const info = await redis.info("memory");

    // Parse memory info (Redis returns key:value pairs)
    const memoryStats = {};
    const lines = info.split("\r\n");

    for (const line of lines) {
      if (line.includes(":")) {
        const [key, value] = line.split(":");
        // Parse used_memory fields
        if (key.startsWith("used_memory")) {
          memoryStats[key] = key.includes("human")
            ? value
            : parseInt(value) || 0;
        }
        // Parse maxmemory fields
        if (key === "maxmemory" || key === "maxmemory_human") {
          memoryStats[key] =
            key === "maxmemory_human" ? value : parseInt(value) || 0;
        }
      }
    }

    // Convert bytes to human-readable format
    const usedMemory = memoryStats.used_memory || 0;
    const usedMemoryHuman = memoryStats.used_memory_human || "0B";
    const usedMemoryPeak = memoryStats.used_memory_peak || 0;
    const usedMemoryPeakHuman = memoryStats.used_memory_peak_human || "0B";

    return {
      available: true,
      used_memory_bytes: usedMemory,
      used_memory_human: usedMemoryHuman,
      used_memory_peak_bytes: usedMemoryPeak,
      used_memory_peak_human: usedMemoryPeakHuman,
      // Calculate percentage if maxmemory is set
      maxmemory: memoryStats.maxmemory || null,
      maxmemory_human: memoryStats.maxmemory_human || null,
      memory_usage_percent: memoryStats.maxmemory
        ? ((usedMemory / memoryStats.maxmemory) * 100).toFixed(2)
        : null,
    };
  } catch (error) {
    return {
      error: error.message,
      available: false,
    };
  }
}

/**
 * Get Redis connection status
 * @returns {Object} Connection status
 */
function getConnectionStatus() {
  return {
    isReady: redis.isReady,
    isOpen: redis.isOpen || false,
  };
}

/**
 * Get comprehensive Redis health check
 * @returns {Promise<Object>} Full health status
 */
async function getHealthStatus() {
  const memoryInfo = await getMemoryInfo();
  const connectionStatus = getConnectionStatus();

  return {
    connection: connectionStatus,
    memory: memoryInfo,
    status:
      connectionStatus.isReady && memoryInfo.available
        ? "healthy"
        : "unhealthy",
  };
}

module.exports = {
  getMemoryInfo,
  getConnectionStatus,
  getHealthStatus,
};
