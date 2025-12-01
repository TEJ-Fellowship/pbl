/**
 * Database Connection Pool Monitoring Middleware
 * Monitors pool usage and logs warnings when approaching limits
 */

const { getPoolStats } = require('../utils/db');
const { NODE_ENV } = require('../utils/config');

// Track last warning time to avoid spam
const lastWarning = {
  primary: 0,
  replica1: 0,
  replica2: 0,
};

const WARNING_INTERVAL = 10000; // 10 seconds between warnings
const CRITICAL_THRESHOLD = 0.9; // 90% usage
const WARNING_THRESHOLD = 0.8; // 80% usage

/**
 * Monitor connection pools and log warnings
 */
const monitorPools = () => {
  const stats = getPoolStats();
  const now = Date.now();

  // Check primary pool
  if (stats.primary.max > 0) {
    const primaryUsage = stats.primary.using / stats.primary.max;
    const primaryWaiting = stats.primary.waiting;

    if (primaryUsage >= CRITICAL_THRESHOLD && now - lastWarning.primary > WARNING_INTERVAL) {
      console.error('🚨 CRITICAL: Primary DB pool at', 
        Math.round(primaryUsage * 100) + '%', 
        `(${stats.primary.using}/${stats.primary.max} connections)`,
        `Waiting: ${primaryWaiting}`
      );
      lastWarning.primary = now;
      
      // Auto-scale suggestion
      if (primaryWaiting > 50) {
        console.error('💡 SUGGESTION: Consider increasing primary pool max connections');
      }
    } else if (primaryUsage >= WARNING_THRESHOLD && now - lastWarning.primary > WARNING_INTERVAL) {
      console.warn('⚠️  WARNING: Primary DB pool at', 
        Math.round(primaryUsage * 100) + '%', 
        `(${stats.primary.using}/${stats.primary.max} connections)`
      );
      lastWarning.primary = now;
    }

    if (primaryWaiting > 10 && now - lastWarning.primary > WARNING_INTERVAL) {
      console.error('🚨 CRITICAL: Primary DB pool exhausted!', 
        `${primaryWaiting} requests waiting for connections`
      );
      lastWarning.primary = now;
      
      // Auto-scale suggestion
      if (primaryWaiting > 50) {
        console.error('💡 SUGGESTION: Consider increasing primary pool max connections');
      }
    }
  }

  // Check replica 1 pool
  if (stats.replica1.max > 0) {
    const replica1Usage = stats.replica1.using / stats.replica1.max;
    const replica1Waiting = stats.replica1.waiting;

    if (replica1Usage >= CRITICAL_THRESHOLD && now - lastWarning.replica1 > WARNING_INTERVAL) {
      console.error('🚨 CRITICAL: Replica 1 DB pool at', 
        Math.round(replica1Usage * 100) + '%', 
        `(${stats.replica1.using}/${stats.replica1.max} connections)`,
        `Waiting: ${replica1Waiting}`
      );
      lastWarning.replica1 = now;
      
      // Auto-scale suggestion
      if (replica1Waiting > 50) {
        console.error('💡 SUGGESTION: Consider increasing replica 1 pool max connections');
      }
    } else if (replica1Usage >= WARNING_THRESHOLD && now - lastWarning.replica1 > WARNING_INTERVAL) {
      console.warn('⚠️  WARNING: Replica 1 DB pool at', 
        Math.round(replica1Usage * 100) + '%', 
        `(${stats.replica1.using}/${stats.replica1.max} connections)`
      );
      lastWarning.replica1 = now;
    }

    if (replica1Waiting > 10 && now - lastWarning.replica1 > WARNING_INTERVAL) {
      console.error('🚨 CRITICAL: Replica 1 DB pool exhausted!', 
        `${replica1Waiting} requests waiting for connections`
      );
      lastWarning.replica1 = now;
      
      // Auto-scale suggestion
      if (replica1Waiting > 50) {
        console.error('💡 SUGGESTION: Consider increasing replica 1 pool max connections');
      }
    }
  }

  // Check replica 2 pool
  if (stats.replica2.max > 0) {
    const replica2Usage = stats.replica2.using / stats.replica2.max;
    const replica2Waiting = stats.replica2.waiting;

    if (replica2Usage >= CRITICAL_THRESHOLD && now - lastWarning.replica2 > WARNING_INTERVAL) {
      console.error('🚨 CRITICAL: Replica 2 DB pool at', 
        Math.round(replica2Usage * 100) + '%', 
        `(${stats.replica2.using}/${stats.replica2.max} connections)`,
        `Waiting: ${replica2Waiting}`
      );
      lastWarning.replica2 = now;
      
      // Auto-scale suggestion
      if (replica2Waiting > 50) {
        console.error('💡 SUGGESTION: Consider increasing replica 2 pool max connections');
      }
    } else if (replica2Usage >= WARNING_THRESHOLD && now - lastWarning.replica2 > WARNING_INTERVAL) {
      console.warn('⚠️  WARNING: Replica 2 DB pool at', 
        Math.round(replica2Usage * 100) + '%', 
        `(${stats.replica2.using}/${stats.replica2.max} connections)`
      );
      lastWarning.replica2 = now;
    }

    if (replica2Waiting > 10 && now - lastWarning.replica2 > WARNING_INTERVAL) {
      console.error('🚨 CRITICAL: Replica 2 DB pool exhausted!', 
        `${replica2Waiting} requests waiting for connections`
      );
      lastWarning.replica2 = now;
      
      // Auto-scale suggestion
      if (replica2Waiting > 50) {
        console.error('💡 SUGGESTION: Consider increasing replica 2 pool max connections');
      }
    }
  }
};

/**
 * Start pool monitoring (runs every 5 seconds)
 */
const startPoolMonitoring = () => {
  if (NODE_ENV === 'development') {
    console.log('📊 Starting database connection pool monitoring...');
  }

  // Monitor every 5 seconds
  setInterval(() => {
    try {
      monitorPools();
    } catch (error) {
      // Silently fail to avoid breaking the app
      if (NODE_ENV === 'development') {
        console.error('Pool monitoring error:', error.message);
      }
    }
  }, 5000);
};

/**
 * Get current pool stats (for API endpoints)
 */
const getPoolStatsForAPI = () => {
  const stats = getPoolStats();
  return {
    primary: {
      using: stats.primary.using,
      available: stats.primary.available,
      waiting: stats.primary.waiting,
      max: stats.primary.max,
      usagePercent: stats.primary.max > 0 
        ? Math.round((stats.primary.using / stats.primary.max) * 100) 
        : 0,
    },
    replica1: {
      using: stats.replica1.using,
      available: stats.replica1.available,
      waiting: stats.replica1.waiting,
      max: stats.replica1.max,
      usagePercent: stats.replica1.max > 0 
        ? Math.round((stats.replica1.using / stats.replica1.max) * 100) 
        : 0,
    },
    replica2: {
      using: stats.replica2.using,
      available: stats.replica2.available,
      waiting: stats.replica2.waiting,
      max: stats.replica2.max,
      usagePercent: stats.replica2.max > 0 
        ? Math.round((stats.replica2.using / stats.replica2.max) * 100) 
        : 0,
    },
  };
};

module.exports = {
  startPoolMonitoring,
  monitorPools,
  getPoolStatsForAPI,
};

