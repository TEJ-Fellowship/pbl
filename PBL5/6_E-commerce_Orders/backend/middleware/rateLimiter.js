const rateLimit = require('express-rate-limit');
const { NODE_ENV } = require('../utils/config');

/**
 * General API rate limiter - prevents abuse
 * 100 requests per minute per IP
 */
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip rate limiting in development for easier testing
  skip: (req) => NODE_ENV === 'development' && req.ip === '::1',
});

/**
 * Strict rate limiter for write operations (cart, checkout)
 * 20 requests per minute per IP
 */
const writeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 write requests per minute per IP
  message: {
    success: false,
    message: 'Too many write requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => NODE_ENV === 'development' && req.ip === '::1',
});

/**
 * Very strict rate limiter for payment status polling
 * 30 requests per minute per IP (prevents polling spam)
 */
const pollingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 polling requests per minute per IP
  message: {
    success: false,
    message: 'Too many polling requests, please wait before checking again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => NODE_ENV === 'development' && req.ip === '::1',
});

/**
 * Lenient rate limiter for read operations (browsing)
 * 200 requests per minute per IP
 */
const readLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // 200 read requests per minute per IP
  message: {
    success: false,
    message: 'Too many requests, please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => NODE_ENV === 'development' && req.ip === '::1',
});

module.exports = {
  generalLimiter,
  writeLimiter,
  pollingLimiter,
  readLimiter,
};

