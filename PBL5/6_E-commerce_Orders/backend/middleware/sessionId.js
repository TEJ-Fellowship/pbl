/**
 * Session ID Middleware
 * Generates or retrieves session ID for guest users
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Middleware to generate/retrieve session ID
 */
const sessionIdMiddleware = (req, res, next) => {
  // Get session ID from header or cookie, or generate new one
  let sessionId = req.headers['x-session-id'] || req.cookies?.session_id;
  
  if (!sessionId) {
    sessionId = uuidv4();
  }
  
  req.sessionId = sessionId;
  
  // Set session ID in response cookie
  res.cookie('session_id', sessionId, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  
  next();
};

module.exports = sessionIdMiddleware;

