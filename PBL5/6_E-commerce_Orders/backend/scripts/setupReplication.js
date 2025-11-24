/**
 * Automated Replication Setup Script
 * Configures PostgreSQL logical replication between PRIMARY and REPLICAS
 * 
 * This script:
 * 1. Checks if replication is already configured
 * 2. Sets up publications on PRIMARY
 * 3. Sets up subscriptions on REPLICAS
 * 4. Verifies replication is working
 * 
 * Note: Some operations require superuser privileges or database admin access
 */

require('dotenv').config();
const { sequelizePrimary, sequelizeReplica1, sequelizeReplica2 } = require('../utils/db');

/**
 * Parse database URL to extract connection details
 */
function parseDatabaseUrl(url) {
  try {
    if (!url) return null;
    
    // Handle postgresql:// or postgres:// URLs
    const urlPattern = /^(?:postgresql|postgres):\/\/(?:([^:]+):([^@]+)@)?([^:]+)(?::(\d+))?\/(.+)$/;
    const match = url.match(urlPattern);
    
    if (match) {
      return {
        user: match[1] || 'postgres',
        password: match[2] || '',
        host: match[3] || 'localhost',
        port: match[4] || '5432',
        database: match[5]
      };
    }
    
    // Fallback: try to extract from connection string format
    const parts = {};
    url.split(' ').forEach(part => {
      const [key, value] = part.split('=');
      if (key && value) {
        parts[key] = value.replace(/['"]/g, '');
      }
    });
    
    if (parts.host || parts.dbname) {
      return {
        host: parts.host || 'localhost',
        port: parts.port || '5432',
        database: parts.dbname,
        user: parts.user || 'postgres',
        password: parts.password || ''
      };
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Get current WAL level value
 */
async function getCurrentWalLevel(sequelize) {
  try {
    // Try pg_settings query first (more reliable)
    try {
      const [result] = await sequelize.query(`
        SELECT setting as wal_level 
        FROM pg_settings 
        WHERE name = 'wal_level'
      `);
      
      if (result && result.length > 0 && result[0].wal_level) {
        return result[0].wal_level;
      }
    } catch (pgSettingsError) {
      // Fall back to SHOW command if pg_settings fails
    }
    
    // Fallback to SHOW command
    const queryResult = await sequelize.query("SHOW wal_level");
    
    // Handle different Sequelize result formats
    let walLevelValue = null;
    
    // Sequelize can return results in different formats depending on version
    if (Array.isArray(queryResult)) {
      // Format: [[{wal_level: 'logical'}], metadata]
      if (queryResult[0] && Array.isArray(queryResult[0]) && queryResult[0].length > 0) {
        walLevelValue = queryResult[0][0].wal_level || queryResult[0][0].WAL_LEVEL;
      }
      // Format: [{wal_level: 'logical'}]
      else if (queryResult[0] && typeof queryResult[0] === 'object') {
        walLevelValue = queryResult[0].wal_level || queryResult[0].WAL_LEVEL;
      }
    } else if (queryResult && typeof queryResult === 'object') {
      walLevelValue = queryResult.wal_level || queryResult.WAL_LEVEL;
    }
    
    return walLevelValue;
  } catch (error) {
    return null;
  }
}

/**
 * Check if replication is enabled on PRIMARY
 */
async function checkReplicationEnabled(sequelize) {
  try {
    const walLevel = await getCurrentWalLevel(sequelize);
    if (!walLevel) {
      return false;
    }
    return walLevel === 'logical';
  } catch (error) {
    console.error('❌ Failed to check WAL level:', error.message);
    return false;
  }
}

/**
 * Check if publication exists
 */
async function publicationExists(sequelize, pubName) {
  try {
    const queryResult = await sequelize.query(`
      SELECT 1 FROM pg_publication WHERE pubname = $1
    `, { bind: [pubName] });
    
    // Handle different result formats
    const results = Array.isArray(queryResult[0]) ? queryResult[0] : queryResult;
    return Array.isArray(results) && results.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Check if subscription exists
 */
async function subscriptionExists(sequelize, subName) {
  try {
    const queryResult = await sequelize.query(`
      SELECT 1 FROM pg_subscription WHERE subname = $1
    `, { bind: [subName] });
    
    // Handle different result formats
    const results = Array.isArray(queryResult[0]) ? queryResult[0] : queryResult;
    return Array.isArray(results) && results.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Create replication user on PRIMARY (if not exists)
 */
async function createReplicationUser(sequelize, username, password) {
  try {
    // Check if user exists
    const queryResult = await sequelize.query(`
      SELECT 1 FROM pg_roles WHERE rolname = $1
    `, { bind: [username] });
    
    // Handle different result formats
    const users = Array.isArray(queryResult[0]) ? queryResult[0] : queryResult;
    
    if (Array.isArray(users) && users.length > 0) {
      console.log(`   ✅ Replication user '${username}' already exists`);
      // Still grant permissions in case they're missing
      try {
        const dbInfo = parseDatabaseUrl(process.env.DATABASE_URL1);
        if (dbInfo) {
          await sequelize.query(`
            GRANT CONNECT ON DATABASE ${dbInfo.database} TO ${username}
          `);
          await sequelize.query(`
            GRANT USAGE ON SCHEMA public TO ${username}
          `);
          await sequelize.query(`
            GRANT SELECT ON ALL TABLES IN SCHEMA public TO ${username}
          `);
        }
      } catch (grantError) {
        // Ignore grant errors if permissions already exist
      }
      return true;
    }
    
    // Try to create user (escape password for SQL)
    const escapedPassword = password.replace(/'/g, "''");
    await sequelize.query(`
      CREATE USER ${username} WITH REPLICATION PASSWORD '${escapedPassword}'
    `);
    
    // Grant permissions
    const dbInfo = parseDatabaseUrl(process.env.DATABASE_URL1);
    if (dbInfo) {
      await sequelize.query(`
        GRANT CONNECT ON DATABASE ${dbInfo.database} TO ${username}
      `);
      await sequelize.query(`
        GRANT USAGE ON SCHEMA public TO ${username}
      `);
      await sequelize.query(`
        GRANT SELECT ON ALL TABLES IN SCHEMA public TO ${username}
      `);
      await sequelize.query(`
        ALTER DEFAULT PRIVILEGES IN SCHEMA public 
        GRANT SELECT ON TABLES TO ${username}
      `);
    }
    
    console.log(`   ✅ Created replication user '${username}'`);
    return true;
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      console.log(`   ✅ Replication user '${username}' already exists`);
      return true;
    }
    console.error(`   ⚠️  Could not create replication user: ${error.message}`);
    console.error(`   ℹ️  You may need to create it manually with superuser privileges:`);
    const escapedPassword = password.replace(/'/g, "''");
    const dbInfo = parseDatabaseUrl(process.env.DATABASE_URL1);
    console.error(`      CREATE USER ${username} WITH REPLICATION PASSWORD '${escapedPassword}';`);
    console.error(`      GRANT CONNECT ON DATABASE ${dbInfo?.database || 'your_db'} TO ${username};`);
    return false;
  }
}

/**
 * Create publication on PRIMARY
 */
async function createPublication(sequelize, pubName) {
  try {
    const exists = await publicationExists(sequelize, pubName);
    if (exists) {
      console.log(`   ✅ Publication '${pubName}' already exists`);
      return true;
    }
    
    // Try to create publication for all tables
    await sequelize.query(`
      CREATE PUBLICATION ${pubName} FOR ALL TABLES
    `);
    
    console.log(`   ✅ Created publication '${pubName}'`);
    return true;
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log(`   ✅ Publication '${pubName}' already exists`);
      return true;
    }
    console.error(`   ❌ Failed to create publication: ${error.message}`);
    return false;
  }
}

/**
 * Create subscription on REPLICA
 */
async function createSubscription(sequelize, subName, connString, pubName) {
  try {
    const exists = await subscriptionExists(sequelize, subName);
    if (exists) {
      console.log(`   ✅ Subscription '${subName}' already exists`);
      return true;
    }
    
    // Create subscription with connection string
    await sequelize.query(`
      CREATE SUBSCRIPTION ${subName}
      CONNECTION '${connString}'
      PUBLICATION ${pubName}
      WITH (
        copy_data = true,
        create_slot = true,
        enabled = true
      )
    `);
    
    console.log(`   ✅ Created subscription '${subName}'`);
    return true;
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log(`   ✅ Subscription '${subName}' already exists`);
      return true;
    }
    console.error(`   ❌ Failed to create subscription: ${error.message}`);
    console.error(`   ℹ️  Make sure:`);
    console.error(`      - Replication user exists and has proper permissions`);
    console.error(`      - Network connectivity between databases`);
    console.error(`      - pg_hba.conf allows replication connections`);
    return false;
  }
}

/**
 * Verify replication is working
 */
async function verifyReplication(sequelizePrimary, sequelizeReplica1, sequelizeReplica2) {
  try {
    console.log('\n🔍 Verifying replication...');
    
    // Insert a test record on primary
    const testSku = `TEST-REPLICATION-${Date.now()}`;
    await sequelizePrimary.query(`
      INSERT INTO products (id, title, price, sku, stock)
      VALUES (gen_random_uuid(), 'Replication Test Product', 99.99, $1, 100)
      ON CONFLICT (sku) DO NOTHING
    `, { bind: [testSku] });
    
    // Wait a bit for replication
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if it appears on replicas
    const [rep1Check] = await sequelizeReplica1.query(`
      SELECT COUNT(*) as count FROM products WHERE sku = $1
    `, { bind: [testSku] });
    
    const [rep2Check] = await sequelizeReplica2.query(`
      SELECT COUNT(*) as count FROM products WHERE sku = $1
    `, { bind: [testSku] });
    
    // Clean up test record
    await sequelizePrimary.query(`DELETE FROM products WHERE sku = $1`, { bind: [testSku] });
    
    const rep1HasIt = parseInt(rep1Check[0].count) > 0;
    const rep2HasIt = parseInt(rep2Check[0].count) > 0;
    
    if (rep1HasIt && rep2HasIt) {
      console.log('   ✅ Replication is working! Both replicas received the test record.');
      return true;
    } else {
      console.log('   ⚠️  Replication may not be fully working:');
      console.log(`      Replica 1: ${rep1HasIt ? '✅' : '❌'}`);
      console.log(`      Replica 2: ${rep2HasIt ? '✅' : '❌'}`);
      return false;
    }
  } catch (error) {
    console.error('   ❌ Verification failed:', error.message);
    return false;
  }
}

/**
 * Main setup function
 */
async function setupReplication() {
  try {
    console.log('🚀 Setting up PostgreSQL Logical Replication\n');
    console.log('='.repeat(60));
    
    // Check connections
    await sequelizePrimary.authenticate();
    console.log('✅ Connected to PRIMARY database');
    
    await sequelizeReplica1.authenticate();
    console.log('✅ Connected to REPLICA 1 database');
    
    await sequelizeReplica2.authenticate();
    console.log('✅ Connected to REPLICA 2 database');
    
    // Check if using Render.com (common managed service limitation)
    const primaryUrl = process.env.DATABASE_URL1 || '';
    if (primaryUrl.includes('render.com') || primaryUrl.includes('onrender.com')) {
      console.log('\n⚠️  Detected Render.com PostgreSQL database');
      console.log('   Render.com does NOT support PostgreSQL logical replication.');
      console.log('   See RENDER_REPLICATION_SETUP.md for alternative solutions.\n');
      console.log('   Options:');
      console.log('   1. Use application-level sync: npm run sync-replicas');
      console.log('   2. Migrate to AWS RDS, Azure, or self-hosted PostgreSQL');
      console.log('   3. Check if Render offers read replicas for your plan\n');
      
      return {
        success: false,
        message: 'Render.com does not support logical replication. See RENDER_REPLICATION_SETUP.md for alternatives.',
        isRender: true
      };
    }
    
    // Check if replication is enabled
    console.log('\n📋 Step 1: Checking replication configuration...');
    
    const currentWalLevel = await getCurrentWalLevel(sequelizePrimary);
    if (currentWalLevel) {
      console.log(`   Current WAL level: ${currentWalLevel}`);
    }
    
    let replicationEnabled = await checkReplicationEnabled(sequelizePrimary);
    
    if (!replicationEnabled) {
      console.log(`\n⚠️  WAL level is "${currentWalLevel || 'unknown'}" but needs to be "logical" for replication`);
      console.log('   Attempting to configure automatically via SQL...\n');
      
      // Try to set WAL level automatically
      let configSuccess = false;
      try {
        console.log('   🔧 Setting wal_level to logical...');
        await sequelizePrimary.query("ALTER SYSTEM SET wal_level = 'logical'");
        console.log('      ✅ wal_level set');
        
        console.log('   🔧 Setting max_wal_senders to 10...');
        await sequelizePrimary.query("ALTER SYSTEM SET max_wal_senders = 10");
        console.log('      ✅ max_wal_senders set');
        
        console.log('   🔧 Setting max_replication_slots to 10...');
        await sequelizePrimary.query("ALTER SYSTEM SET max_replication_slots = 10");
        console.log('      ✅ max_replication_slots set');
        
        console.log('   🔧 Reloading configuration...');
        await sequelizePrimary.query("SELECT pg_reload_conf()");
        console.log('      ✅ Configuration reloaded');
        
        configSuccess = true;
      } catch (configError) {
        console.error(`   ❌ Configuration step failed: ${configError.message}`);
        
        // Check if it's a permission error
        if (configError.message.includes('permission') || 
            configError.message.includes('must be superuser') ||
            configError.message.includes('superuser') ||
            configError.message.includes('insufficient privilege')) {
          console.log('\n   💡 You need superuser privileges to change these settings.');
          console.log('   If using a managed database (AWS RDS, Azure, etc.), enable logical replication through their console.\n');
        }
      }
      
      if (configSuccess) {
        console.log('\n   ✅ Configuration commands executed successfully!');
        console.log('\n   ⚠️  CRITICAL: PostgreSQL server MUST be RESTARTED for wal_level changes to take effect.');
        console.log('   The wal_level setting cannot be changed without a server restart.\n');
        console.log('   Next steps:');
        console.log('   1. Restart your PostgreSQL server');
        console.log('   2. Run this script again: npm run setup-replication');
        console.log('   3. The script will then complete the replication setup\n');
        
        return {
          success: false,
          message: 'WAL level configured but PostgreSQL restart required. Please restart PostgreSQL and run this script again.',
          requiresRestart: true
        };
      } else {
        console.log('\n   📚 Quick Help Commands:');
        console.log('   Run these to get detailed instructions:');
        console.log('      npm run find-postgres-config      # Find config file location');
        console.log('      npm run generate-replication-sql  # Generate SQL commands\n');
        
        console.log('   Manual Configuration Options:\n');
        console.log('   Option 1 - SQL Commands (if you have superuser access):');
        console.log('   1. Connect to PRIMARY as superuser: psql -U postgres -d your_db');
        console.log('   2. Run: npm run generate-replication-sql (for exact commands)');
        console.log('   3. Execute the SQL commands shown');
        console.log('   4. RESTART PostgreSQL server (required!)');
        console.log('   5. Run this script again\n');
        
        console.log('   Option 2 - Edit postgresql.conf (if you have file access):');
        console.log('   1. Run: npm run find-postgres-config (to find config file)');
        console.log('   2. Edit postgresql.conf and add:');
        console.log('      wal_level = logical');
        console.log('      max_wal_senders = 10');
        console.log('      max_replication_slots = 10');
        console.log('   3. RESTART PostgreSQL server');
        console.log('   4. Run this script again\n');
        
        console.log('   Option 3 - Managed Database Services:');
        console.log('   AWS RDS: Set rds.logical_replication = 1 in parameter group');
        console.log('   Azure: Set azure.replication_support = logical in server parameters');
        console.log('   Google Cloud SQL: Enable logical replication in instance settings');
        console.log('   Then restart the database instance\n');
        
        console.log('   📖 See REPLICATION_SETUP_GUIDE.md for detailed instructions\n');
        
        return {
          success: false,
          message: 'Replication not enabled. Please configure PostgreSQL server settings first.',
          requiresManualConfig: true
        };
      }
    }
    
    console.log('   ✅ Logical replication is enabled');
    
    // Parse database URLs
    const primaryInfo = parseDatabaseUrl(process.env.DATABASE_URL1);
    const replica1Info = parseDatabaseUrl(process.env.DATABASE_URL2);
    const replica2Info = parseDatabaseUrl(process.env.DATABASE_URL3);
    
    if (!primaryInfo || !replica1Info || !replica2Info) {
      console.error('❌ Could not parse database URLs from environment variables');
      return { success: false, message: 'Invalid database URLs' };
    }
    
    // Create replication user (optional - may need manual setup)
    console.log('\n📋 Step 2: Setting up replication user...');
    const replicationUser = process.env.REPLICATION_USER || 'replicator';
    const replicationPassword = process.env.REPLICATION_PASSWORD || 'replicator_password';
    
    await createReplicationUser(sequelizePrimary, replicationUser, replicationPassword);
    
    // Create publication
    console.log('\n📋 Step 3: Creating publication on PRIMARY...');
    const pubName = 'ecommerce_pub';
    const pubSuccess = await createPublication(sequelizePrimary, pubName);
    
    if (!pubSuccess) {
      return {
        success: false,
        message: 'Failed to create publication. Check database permissions.'
      };
    }
    
    // Create subscriptions
    console.log('\n📋 Step 4: Creating subscriptions on REPLICAS...');
    
    // Build primary connection string for replicas using replication user
    // Escape password for connection string
    const escapedPassword = replicationPassword.replace(/'/g, "''");
    const primaryConnString = `host=${primaryInfo.host} port=${primaryInfo.port} dbname=${primaryInfo.database} user=${replicationUser} password=${escapedPassword}`;
    
    const sub1Success = await createSubscription(
      sequelizeReplica1,
      'sub_replica1',
      primaryConnString,
      pubName
    );
    
    const sub2Success = await createSubscription(
      sequelizeReplica2,
      'sub_replica2',
      primaryConnString,
      pubName
    );
    
    if (!sub1Success || !sub2Success) {
      return {
        success: false,
        message: 'Failed to create subscriptions. Check network connectivity and permissions.'
      };
    }
    
    // Verify replication
    console.log('\n📋 Step 5: Verifying replication...');
    const verified = await verifyReplication(sequelizePrimary, sequelizeReplica1, sequelizeReplica2);
    
    if (verified) {
      console.log('\n' + '='.repeat(60));
      console.log('✅ Replication setup completed successfully!');
      console.log('='.repeat(60));
      console.log('\n📊 Replication Status:');
      console.log('   - Publication: ecommerce_pub (on PRIMARY)');
      console.log('   - Subscription: sub_replica1 (on REPLICA 1)');
      console.log('   - Subscription: sub_replica2 (on REPLICA 2)');
      console.log('\n💡 All future writes to PRIMARY will automatically sync to REPLICAS');
      
      return { success: true, message: 'Replication configured successfully' };
    } else {
      console.log('\n⚠️  Replication setup completed but verification failed.');
      console.log('   Replication may still be working - check with: npm run check-replication');
      
      return {
        success: true,
        message: 'Replication configured but verification failed. Check manually.',
        warning: true
      };
    }
    
  } catch (error) {
    console.error('\n❌ Replication setup failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Ensure PostgreSQL version is 10+ (logical replication required)');
    console.error('   2. Check database connection strings in .env file');
    console.error('   3. Verify replication user has proper permissions');
    console.error('   4. Check network connectivity between databases');
    console.error('   5. Review PostgreSQL logs for detailed errors');
    console.error('\n   Run: npm run check-replication (for diagnostics)');
    
    return {
      success: false,
      message: error.message
    };
  }
}

// Run if called directly
if (require.main === module) {
  (async () => {
    try {
      const result = await setupReplication();
      process.exit(result.success ? 0 : 1);
    } catch (error) {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    }
  })();
}

module.exports = { setupReplication };

