/**
 * Redis-based Rate Limiter Middleware
 * Prevents abuse by limiting requests per IP address
 * Works with PM2 cluster mode (shared Redis state)
 */

const redis = require("../utils/redis");

/**
 * Create a rate limiter middleware
 * @param {Object} options - Rate limit options
 * @param {number} options.windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @param {number} options.maxRequests - Max requests per window (default: 100)
 * @param {string} options.keyPrefix - Redis key prefix (default: "ratelimit:")
 * @param {Function} options.keyGenerator - Custom key generator function (default: uses IP)
 * @returns {Function} Express middleware
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = 60000, // 1 minute default
    maxRequests = 100,
    keyPrefix = "ratelimit:",
    keyGenerator = (req) => {
      // Default: rate limit by IP address
      // Express automatically provides req.ip
      // Also check X-Forwarded-For header (for load testing with simulated IPs)
      return (
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.ip ||
        req.connection?.remoteAddress ||
        "unknown"
      );
    },
  } = options;

  return async (req, res, next) => {
    try {
      // Skip rate limiting if Redis is not ready (fail open)
      if (!redis.isReady) {
        return next();
      }

      // Generate unique key for this client
      const clientKey = keyGenerator(req);
      const redisKey = `${keyPrefix}${clientKey}`;

      // Get current count from Redis
      const currentCount = await redis.get(redisKey);

      if (currentCount === null) {
        // First request in this window - create new counter
        // Set with expiration (windowMs converted to seconds)
        await redis.setEx(redisKey, Math.ceil(windowMs / 1000), "1");
        return next(); // Allow request
      }

      const count = parseInt(currentCount, 10);

      if (count >= maxRequests) {
        // Rate limit exceeded
        const ttl = await redis.ttl(redisKey);
        return res.status(429).json({
          error: "Too Many Requests",
          message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${
            windowMs / 1000
          } seconds.`,
          retryAfter: ttl, // Seconds until limit resets
        });
      }

      // Increment counter (Redis auto-extends TTL on increment)
      await redis.incr(redisKey);
      next(); // Allow request
    } catch (error) {
      // If Redis fails, allow request (fail open - don't block legitimate users)
      console.error("Rate limiter error:", error.message);
      next();
    }
  };
}

// Pre-configured rate limiters for common use cases
const rateLimiters = {
  // General API: 100 requests per minute
  general: createRateLimiter({
    windowMs: 60000, // 1 minute
    maxRequests: 100,
    keyPrefix: "ratelimit:general:",
  }),

  // Booking creation: 10 requests per minute (strict - prevents abuse)
  booking: createRateLimiter({
    windowMs: 60000, // 1 minute
    maxRequests: 10,
    keyPrefix: "ratelimit:booking:",
  }),

  // Payment processing: 5 requests per minute (very strict - prevents fraud)
  payment: createRateLimiter({
    windowMs: 60000, // 1 minute
    maxRequests: 5,
    keyPrefix: "ratelimit:payment:",
  }),

  // Per-user rate limiting (requires authentication - for future use)
  perUser: (maxRequests = 100, windowMs = 60000) =>
    createRateLimiter({
      windowMs,
      maxRequests,
      keyPrefix: "ratelimit:user:",
      keyGenerator: (req) => {
        // Use user ID if authenticated, fallback to IP
        return req.user?.id || req.ip || "unknown";
      },
    }),
};

module.exports = {
  createRateLimiter,
  rateLimiters,
};
