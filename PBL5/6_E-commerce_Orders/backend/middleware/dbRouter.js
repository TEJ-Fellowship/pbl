/**
 * Database Router Middleware
 * Automatically routes READ operations to replicas and WRITE operations to primary
 */

const { getReadReplica, getPrimary } = require('../utils/db');
const { sequelizePrimary, sequelizeReplica1, sequelizeReplica2 } = require('../utils/db');

// HTTP methods that are read-only
const READ_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * Middleware to attach appropriate database connection to request
 */
const dbRouter = (req, res, next) => {
  const method = req.method.toUpperCase();
  
  // Determine if this is a read or write operation
  const isReadOperation = READ_METHODS.includes(method);
  
  if (isReadOperation) {
    // Use read replica (round-robin)
    req.db = getReadReplica();
    req.dbType = 'replica';
  } else {
    // Use primary database for writes
    req.db = getPrimary();
    req.dbType = 'primary';
  }
  
  next();
};

/**
 * Force read from replica (for specific routes that need fresh data)
 */
const forceReadReplica = (req, res, next) => {
  req.db = getReadReplica();
  req.dbType = 'replica';
  next();
};

/**
 * Force write to primary (for specific routes)
 */
const forceWritePrimary = (req, res, next) => {
  req.db = getPrimary();
  req.dbType = 'primary';
  next();
};

module.exports = {
  dbRouter,
  forceReadReplica,
  forceWritePrimary
};

