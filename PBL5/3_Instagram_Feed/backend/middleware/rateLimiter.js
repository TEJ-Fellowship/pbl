/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse and ensures fair resource usage
 */

import { redisClient } from "../config/db.js";
import { RATE_LIMIT_CONFIG } from "../config/constants.js";

/**
 * Create a rate limiter middleware
 * @param {Object} options - Rate limit options
 * @param {number} options.maxRequests - Maximum requests per window
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {string} options.keyGenerator - Function to generate rate limit key from request
 * @returns {Function} Express middleware
 */
export function createRateLimiter({
  maxRequests = RATE_LIMIT_CONFIG.MAX_REQUESTS,
  windowMs = RATE_LIMIT_CONFIG.WINDOW_MS,
  keyGenerator = (req) => {
    // Default: use IP address or user ID if available
    return req.user?.id || req.ip || "unknown";
  },
}) {
  return async (req, res, next) => {
    try {
      const key = `ratelimit:${keyGenerator(req)}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Get current count
      const count = await redisClient.get(key);
      const currentCount = count ? parseInt(count, 10) : 0;

      if (currentCount >= maxRequests) {
        // Rate limit exceeded
        const retryAfter = Math.ceil(windowMs / 1000); // Convert to seconds
        res.status(429).json({
          success: false,
          message: "Too many requests",
          error: "Rate limit exceeded",
          retryAfter,
        });
        return;
      }

      // Increment counter
      const pipeline = redisClient.multi();
      pipeline.incr(key);
      pipeline.expire(key, Math.ceil(windowMs / 1000)); // Set TTL
      await pipeline.exec();

      // Add rate limit headers
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader(
        "X-RateLimit-Remaining",
        Math.max(0, maxRequests - currentCount - 1)
      );
      res.setHeader(
        "X-RateLimit-Reset",
        new Date(now + windowMs).toISOString()
      );

      next();
    } catch (error) {
      console.error("Rate limiter error:", error.message);
      // Fail open - allow request if rate limiter fails
      next();
    }
  };
}

/**
 * Rate limiter for post creation (stricter limits)
 */
export const postCreateLimiter = createRateLimiter({
  maxRequests: RATE_LIMIT_CONFIG.POST_CREATE_LIMIT,
  windowMs: RATE_LIMIT_CONFIG.WINDOW_MS,
  keyGenerator: (req) => {
    // Use user_id from body or IP
    return `post:create:${req.body?.user_id || req.ip}`;
  },
});

/**
 * Rate limiter for feed fetching
 */
export const feedFetchLimiter = createRateLimiter({
  maxRequests: RATE_LIMIT_CONFIG.FEED_FETCH_LIMIT,
  windowMs: RATE_LIMIT_CONFIG.WINDOW_MS,
  keyGenerator: (req) => {
    // Use user_id from params or IP
    return `feed:fetch:${req.params?.user_id || req.ip}`;
  },
});

/**
 * General API rate limiter
 */
export const apiLimiter = createRateLimiter({
  maxRequests: RATE_LIMIT_CONFIG.MAX_REQUESTS,
  windowMs: RATE_LIMIT_CONFIG.WINDOW_MS,
});
