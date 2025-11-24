/**
 * Replication Health Check Utility
 * Checks if replication is properly configured and working
 * Can be called on startup to warn if replication is not set up
 */

const { sequelizePrimary, sequelizeReplica1, sequelizeReplica2 } = require('./db');

/**
 * Quick check if replication is configured
 */
async function isReplicationConfigured() {
  try {
    // Check if WAL level is logical
    const [walLevel] = await sequelizePrimary.query("SHOW wal_level");
    if (walLevel[0].wal_level !== 'logical') {
      return { configured: false, reason: 'WAL level is not set to logical' };
    }
    
    // Check if publication exists
    const [publications] = await sequelizePrimary.query(`
      SELECT COUNT(*) as count FROM pg_publication
    `);
    if (parseInt(publications[0].count) === 0) {
      return { configured: false, reason: 'No publications found' };
    }
    
    // Check if subscriptions exist on replicas
    const [subs1] = await sequelizeReplica1.query(`
      SELECT COUNT(*) as count FROM pg_subscription
    `);
    const [subs2] = await sequelizeReplica2.query(`
      SELECT COUNT(*) as count FROM pg_subscription
    `);
    
    if (parseInt(subs1[0].count) === 0 || parseInt(subs2[0].count) === 0) {
      return { configured: false, reason: 'Subscriptions not found on replicas' };
    }
    
    return { configured: true };
  } catch (error) {
    return { configured: false, reason: `Check failed: ${error.message}` };
  }
}

/**
 * Check replication lag
 */
async function checkReplicationLag() {
  try {
    const [stats1] = await sequelizeReplica1.query(`
      SELECT 
        subname,
        status,
        latest_end_lsn,
        latest_end_time
      FROM pg_stat_subscription
      LIMIT 1
    `);
    
    const [stats2] = await sequelizeReplica2.query(`
      SELECT 
        subname,
        status,
        latest_end_lsn,
        latest_end_time
      FROM pg_stat_subscription
      LIMIT 1
    `);
    
    return {
      replica1: stats1.length > 0 ? {
        status: stats1[0].status,
        latestTime: stats1[0].latest_end_time
      } : null,
      replica2: stats2.length > 0 ? {
        status: stats2[0].status,
        latestTime: stats2[0].latest_end_time
      } : null
    };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Verify data consistency between primary and replicas
 */
async function verifyDataConsistency() {
  try {
    const [primaryCount] = await sequelizePrimary.query('SELECT COUNT(*) as count FROM products');
    const [replica1Count] = await sequelizeReplica1.query('SELECT COUNT(*) as count FROM products');
    const [replica2Count] = await sequelizeReplica2.query('SELECT COUNT(*) as count FROM products');
    
    const primary = parseInt(primaryCount[0].count);
    const rep1 = parseInt(replica1Count[0].count);
    const rep2 = parseInt(replica2Count[0].count);
    
    return {
      primary,
      replica1: rep1,
      replica2: rep2,
      consistent: (primary === rep1 && primary === rep2),
      difference: {
        replica1: primary - rep1,
        replica2: primary - rep2
      }
    };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Comprehensive replication health check
 */
async function checkReplicationHealth() {
  const health = {
    configured: false,
    working: false,
    warnings: [],
    errors: []
  };
  
  try {
    // Check if configured
    const configCheck = await isReplicationConfigured();
    health.configured = configCheck.configured;
    
    if (!health.configured) {
      health.warnings.push(`Replication not configured: ${configCheck.reason}`);
      health.warnings.push('Run: npm run setup-replication');
      return health;
    }
    
    // Check replication lag
    const lagInfo = await checkReplicationLag();
    if (lagInfo.error) {
      health.warnings.push(`Could not check replication lag: ${lagInfo.error}`);
    } else {
      if (lagInfo.replica1 && lagInfo.replica1.status !== 'active') {
        health.warnings.push(`Replica 1 status: ${lagInfo.replica1.status}`);
      }
      if (lagInfo.replica2 && lagInfo.replica2.status !== 'active') {
        health.warnings.push(`Replica 2 status: ${lagInfo.replica2.status}`);
      }
    }
    
    // Check data consistency
    const consistency = await verifyDataConsistency();
    if (consistency.error) {
      health.errors.push(`Data consistency check failed: ${consistency.error}`);
    } else if (!consistency.consistent) {
      health.warnings.push(`Data inconsistency detected:`);
      health.warnings.push(`  Primary: ${consistency.primary} products`);
      health.warnings.push(`  Replica 1: ${consistency.replica1} products (diff: ${consistency.difference.replica1})`);
      health.warnings.push(`  Replica 2: ${consistency.replica2} products (diff: ${consistency.difference.replica2})`);
    } else {
      health.working = true;
    }
    
    return health;
  } catch (error) {
    health.errors.push(`Health check failed: ${error.message}`);
    return health;
  }
}

module.exports = {
  isReplicationConfigured,
  checkReplicationLag,
  verifyDataConsistency,
  checkReplicationHealth
};

