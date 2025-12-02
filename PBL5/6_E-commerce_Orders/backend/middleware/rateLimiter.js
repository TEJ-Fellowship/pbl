const rateLimit = require('express-rate-limit');
const { NODE_ENV } = require('../utils/config');

// Flag to relax/disable rate limiting during synthetic load tests (k6, etc.)
// Set LOAD_TEST_MODE=true in .env when running load tests from a single IP
// Also auto-detect k6 user agent for convenience
const IS_LOAD_TEST = process.env.LOAD_TEST_MODE === 'true' || 
                     process.env.LOAD_TEST_MODE === '1' ||
                     process.env.NODE_ENV === 'test';

/**
 * General API rate limiter - prevents abuse
 * 100 requests per minute per IP (higher in LOAD_TEST_MODE)
 */
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: IS_LOAD_TEST ? 10000 : 100, // Relax limit for synthetic load tests
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip or relax rate limiting in development/load-test scenarios
  skip: (req) => {
    if (NODE_ENV === 'development' && req.ip === '::1') return true;
    if (IS_LOAD_TEST) return true;
    // Also check for k6 user agent
    const userAgent = req.get('user-agent') || '';
    if (userAgent.includes('k6') || userAgent.includes('load-test')) return true;
    return false;
  },
});

/**
 * Strict rate limiter for write operations (cart, checkout)
 * 20 requests per minute per IP (higher in LOAD_TEST_MODE)
 */
const writeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: IS_LOAD_TEST ? 2000 : 20, // Allow more writes in synthetic tests
  message: {
    success: false,
    message: 'Too many write requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (NODE_ENV === 'development' && req.ip === '::1') return true;
    if (IS_LOAD_TEST) return true;
    // Also check for k6 user agent
    const userAgent = req.get('user-agent') || '';
    if (userAgent.includes('k6') || userAgent.includes('load-test')) return true;
    return false;
  },
});

/**
 * Very strict rate limiter for payment status polling
 * 30 requests per minute per IP (higher in LOAD_TEST_MODE)
 */
const pollingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: IS_LOAD_TEST ? 3000 : 30, // Relax for synthetic tests
  message: {
    success: false,
    message: 'Too many polling requests, please wait before checking again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (NODE_ENV === 'development' && req.ip === '::1') return true;
    if (IS_LOAD_TEST) return true;
    // Also check for k6 user agent
    const userAgent = req.get('user-agent') || '';
    if (userAgent.includes('k6') || userAgent.includes('load-test')) return true;
    return false;
  },
});

/**
 * Lenient rate limiter for read operations (browsing)
 * 200 requests per minute per IP (higher in LOAD_TEST_MODE)
 */
const readLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: IS_LOAD_TEST ? 20000 : 200, // High ceiling for browse traffic in tests
  message: {
    success: false,
    message: 'Too many requests, please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (NODE_ENV === 'development' && req.ip === '::1') return true;
    if (IS_LOAD_TEST) return true;
    // Also check for k6 user agent
    const userAgent = req.get('user-agent') || '';
    if (userAgent.includes('k6') || userAgent.includes('load-test')) return true;
    return false;
  },
});

module.exports = {
  generalLimiter,
  writeLimiter,
  pollingLimiter,
  readLimiter,
};

