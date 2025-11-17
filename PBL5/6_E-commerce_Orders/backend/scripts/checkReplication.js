/**
 * Replication Diagnostic Script
 * Checks replication status and provides fix commands
 */

require('dotenv').config();
const { sequelizePrimary, sequelizeReplica1, sequelizeReplica2 } = require('../utils/db');
const { Product, Category, Inventory } = require('../models');

/**
 * Check PostgreSQL version
 */
async function checkPostgreSQLVersion(sequelize, name) {
  try {
    const [results] = await sequelize.query('SELECT version()');
    const version = results[0].version;
    console.log(`\n📊 ${name} PostgreSQL Version:`);
    console.log(`   ${version}`);
    return version;
  } catch (error) {
    console.error(`❌ Failed to get version from ${name}:`, error.message);
    return null;
  }
}

/**
 * Check WAL level and replication settings (Primary)
 */
async function checkReplicationSettings(sequelize) {
  try {
    const [walLevel] = await sequelize.query("SHOW wal_level");
    const [maxWalSenders] = await sequelize.query("SHOW max_wal_senders");
    const [maxReplicationSlots] = await sequelize.query("SHOW max_replication_slots");
    
    console.log('\n⚙️  Replication Settings (Primary):');
    console.log(`   wal_level: ${walLevel[0].wal_level}`);
    console.log(`   max_wal_senders: ${maxWalSenders[0].max_wal_senders}`);
    console.log(`   max_replication_slots: ${maxReplicationSlots[0].max_replication_slots}`);
    
    return {
      walLevel: walLevel[0].wal_level,
      maxWalSenders: parseInt(maxWalSenders[0].max_wal_senders),
      maxReplicationSlots: parseInt(maxReplicationSlots[0].max_replication_slots)
    };
  } catch (error) {
    console.error('❌ Failed to check replication settings:', error.message);
    return null;
  }
}

/**
 * Check publications (Primary)
 */
async function checkPublications(sequelize) {
  try {
    const [publications] = await sequelize.query(`
      SELECT pubname, puballtables 
      FROM pg_publication
    `);
    
    console.log('\n📢 Publications (Primary):');
    if (publications.length === 0) {
      console.log('   ⚠️  No publications found');
    } else {
      publications.forEach(pub => {
        console.log(`   - ${pub.pubname} (all_tables: ${pub.puballtables})`);
      });
    }
    
    // Check publication tables
    if (publications.length > 0) {
      const [pubTables] = await sequelize.query(`
        SELECT pubname, schemaname, tablename
        FROM pg_publication_tables
        ORDER BY pubname, tablename
      `);
      
      if (pubTables.length > 0) {
        console.log('\n   Publication Tables:');
        pubTables.forEach(pt => {
          console.log(`     ${pt.pubname} → ${pt.schemaname}.${pt.tablename}`);
        });
      }
    }
    
    return publications;
  } catch (error) {
    console.error('❌ Failed to check publications:', error.message);
    return [];
  }
}

/**
 * Check subscriptions (Replica)
 */
async function checkSubscriptions(sequelize, replicaName) {
  try {
    const [subscriptions] = await sequelize.query(`
      SELECT subname, subenabled, subpublications
      FROM pg_subscription
    `);
    
    console.log(`\n📥 Subscriptions (${replicaName}):`);
    if (subscriptions.length === 0) {
      console.log('   ⚠️  No subscriptions found');
    } else {
      subscriptions.forEach(sub => {
        console.log(`   - ${sub.subname} (enabled: ${sub.subenabled})`);
        console.log(`     Publications: ${sub.subpublications.join(', ')}`);
      });
    }
    
    // Check subscription stats
    if (subscriptions.length > 0) {
      const [stats] = await sequelize.query(`
        SELECT 
          subname,
          status,
          latest_end_lsn,
          latest_end_time
        FROM pg_stat_subscription
      `);
      
      if (stats.length > 0) {
        console.log('\n   Subscription Stats:');
        stats.forEach(stat => {
          console.log(`     ${stat.subname}: ${stat.status}`);
          console.log(`       Latest LSN: ${stat.latest_end_lsn || 'N/A'}`);
          console.log(`       Latest Time: ${stat.latest_end_time || 'N/A'}`);
        });
      }
    }
    
    return subscriptions;
  } catch (error) {
    console.error(`❌ Failed to check subscriptions on ${replicaName}:`, error.message);
    return [];
  }
}

/**
 * Check data consistency
 */
async function checkDataConsistency() {
  try {
    console.log('\n📊 Data Consistency Check:');
    
    // Count products
    const [primaryCount] = await sequelizePrimary.query('SELECT COUNT(*) as count FROM products');
    const [replica1Count] = await sequelizeReplica1.query('SELECT COUNT(*) as count FROM products');
    const [replica2Count] = await sequelizeReplica2.query('SELECT COUNT(*) as count FROM products');
    
    console.log(`   Primary products: ${primaryCount[0].count}`);
    console.log(`   Replica 1 products: ${replica1Count[0].count}`);
    console.log(`   Replica 2 products: ${replica2Count[0].count}`);
    
    const primary = parseInt(primaryCount[0].count);
    const rep1 = parseInt(replica1Count[0].count);
    const rep2 = parseInt(replica2Count[0].count);
    
    if (primary === rep1 && primary === rep2) {
      console.log('   ✅ All databases have same product count');
    } else {
      console.log('   ⚠️  Product counts differ - replication may not be working');
    }
    
    // Sample product comparison
    const [primarySample] = await sequelizePrimary.query(`
      SELECT id, sku, title FROM products ORDER BY created_at DESC LIMIT 3
    `);
    
    if (primarySample.length > 0) {
      console.log('\n   Sample Products (Primary):');
      primarySample.forEach(p => {
        console.log(`     - ${p.sku}: ${p.title}`);
      });
      
      // Check if same products exist on replicas
      for (const sample of primarySample) {
        const [rep1Check] = await sequelizeReplica1.query(
          'SELECT COUNT(*) as count FROM products WHERE sku = $1',
          { bind: [sample.sku] }
        );
        const [rep2Check] = await sequelizeReplica2.query(
          'SELECT COUNT(*) as count FROM products WHERE sku = $1',
          { bind: [sample.sku] }
        );
        
        if (rep1Check[0].count === 0 || rep2Check[0].count === 0) {
          console.log(`   ⚠️  Product ${sample.sku} missing on replicas`);
        }
      }
    }
    
    return {
      primary,
      replica1: rep1,
      replica2: rep2,
      consistent: (primary === rep1 && primary === rep2)
    };
  } catch (error) {
    console.error('❌ Failed to check data consistency:', error.message);
    return null;
  }
}

/**
 * Generate fix commands
 */
function generateFixCommands(settings, publications, subscriptions) {
  console.log('\n🔧 Recommended Fix Commands:\n');
  
  if (!settings || settings.walLevel !== 'logical') {
    console.log('1. Enable logical replication on PRIMARY:');
    console.log('   ALTER SYSTEM SET wal_level = \'logical\';');
    console.log('   ALTER SYSTEM SET max_wal_senders = 10;');
    console.log('   ALTER SYSTEM SET max_replication_slots = 10;');
    console.log('   SELECT pg_reload_conf();');
    console.log('   (Then restart PostgreSQL if needed)\n');
  }
  
  if (!publications || publications.length === 0) {
    console.log('2. Create publication on PRIMARY:');
    console.log('   CREATE PUBLICATION ecommerce_pub FOR TABLE');
    console.log('     categories, products, inventory, orders, order_items, payments;\n');
  }
  
  if (!subscriptions || subscriptions.length === 0) {
    console.log('3. Create subscription on REPLICA 1:');
    console.log('   CREATE SUBSCRIPTION sub_replica1');
    console.log('   CONNECTION \'host=PRIMARY_HOST port=5432 dbname=DB_NAME user=replicator password=PASSWORD\'');
    console.log('   PUBLICATION ecommerce_pub');
    console.log('   WITH (copy_data = true, create_slot = true, enabled = true);\n');
    
    console.log('4. Create subscription on REPLICA 2:');
    console.log('   CREATE SUBSCRIPTION sub_replica2');
    console.log('   CONNECTION \'host=PRIMARY_HOST port=5432 dbname=DB_NAME user=replicator password=PASSWORD\'');
    console.log('   PUBLICATION ecommerce_pub');
    console.log('   WITH (copy_data = true, create_slot = true, enabled = true);\n');
  }
}

/**
 * Main diagnostic function
 */
async function runDiagnostics() {
  try {
    console.log('🔍 PostgreSQL Replication Diagnostics\n');
    console.log('=' .repeat(50));
    
    // Check connections
    await sequelizePrimary.authenticate();
    console.log('✅ Connected to PRIMARY');
    
    await sequelizeReplica1.authenticate();
    console.log('✅ Connected to REPLICA 1');
    
    await sequelizeReplica2.authenticate();
    console.log('✅ Connected to REPLICA 2');
    
    // Check versions
    await checkPostgreSQLVersion(sequelizePrimary, 'Primary');
    await checkPostgreSQLVersion(sequelizeReplica1, 'Replica 1');
    await checkPostgreSQLVersion(sequelizeReplica2, 'Replica 2');
    
    // Check replication settings
    const settings = await checkReplicationSettings(sequelizePrimary);
    
    // Check publications
    const publications = await checkPublications(sequelizePrimary);
    
    // Check subscriptions
    const subscriptions1 = await checkSubscriptions(sequelizeReplica1, 'Replica 1');
    const subscriptions2 = await checkSubscriptions(sequelizeReplica2, 'Replica 2');
    
    // Check data consistency
    const consistency = await checkDataConsistency();
    
    // Generate fix commands
    generateFixCommands(settings, publications, [...subscriptions1, ...subscriptions2]);
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Diagnostics completed\n');
    
    return {
      settings,
      publications,
      subscriptions: { replica1: subscriptions1, replica2: subscriptions2 },
      consistency
    };
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  (async () => {
    try {
      await runDiagnostics();
      process.exit(0);
    } catch (error) {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    }
  })();
}

module.exports = { runDiagnostics };

