/**
 * Query Retry Utility with Exponential Backoff and Circuit Breaker
 * Handles transient database connection failures gracefully
 */

const { checkCircuitBreaker, recordCircuitBreakerFailure, recordCircuitBreakerSuccess } = require('./db');

/**
 * Retry a database query with exponential backoff and circuit breaker
 * @param {Function} queryFn - Async function that performs the query
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.baseDelay - Base delay in milliseconds (default: 100)
 * @param {number} options.maxDelay - Maximum delay in milliseconds (default: 5000)
 * @param {string} options.dbType - Database type for circuit breaker tracking (default: 'primary')
 * @returns {Promise} - Result of the query function
 */
const retryQuery = async (queryFn, options = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 100,
    maxDelay = 5000,
    dbType = 'primary', // Track which DB we're using
  } = options;

  // Check circuit breaker first
  if (!checkCircuitBreaker(dbType)) {
    throw new Error(`Circuit breaker is OPEN for ${dbType}. Service temporarily unavailable.`);
  }

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await queryFn();
      // Success - reset circuit breaker
      recordCircuitBreakerSuccess(dbType);
      return result;
    } catch (error) {
      lastError = error;

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        recordCircuitBreakerFailure(dbType);
        break;
      }

      // Only retry on connection/timeout errors
      const isRetriableError = 
        error.name === 'SequelizeConnectionError' ||
        error.name === 'SequelizeConnectionRefusedError' ||
        error.name === 'SequelizeTimeoutError' ||
        error.message?.includes('timeout') ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('Connection lost') ||
        error.message?.includes('pool') ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNREFUSED';

      if (!isRetriableError) {
        // Don't retry non-retriable errors (validation, not found, etc.)
        throw error;
      }

      // Calculate exponential backoff delay
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // If we get here, all retries failed
  throw lastError;
};

/**
 * Retry with custom retry condition
 * @param {Function} queryFn - Async function that performs the query
 * @param {Function} shouldRetry - Function that determines if error should be retried
 * @param {Object} options - Retry options
 */
const retryQueryWithCondition = async (queryFn, shouldRetry, options = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 100,
    maxDelay = 5000,
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        break;
      }

      if (!shouldRetry(error, attempt)) {
        throw error;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

module.exports = {
  retryQuery,
  retryQueryWithCondition,
};

