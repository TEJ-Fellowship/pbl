/**
 * Generates SQL commands needed for replication setup
 * These commands must be run as PostgreSQL superuser
 */

require('dotenv').config();

function parseDatabaseUrlLocal(url) {
  try {
    if (!url) return null;
    
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
    
    return null;
  } catch (error) {
    return null;
  }
}

function generateSQL() {
  console.log('📝 SQL Commands for Replication Setup\n');
  console.log('='.repeat(60));
  console.log('⚠️  IMPORTANT: These commands must be run as PostgreSQL SUPERUSER');
  console.log('='.repeat(60));
  console.log('\n📋 Step 1: Enable Logical Replication\n');
  console.log('-- Connect to PRIMARY database as superuser (psql)');
  console.log('-- Then run these commands:\n');
  console.log('ALTER SYSTEM SET wal_level = \'logical\';');
  console.log('ALTER SYSTEM SET max_wal_senders = 10;');
  console.log('ALTER SYSTEM SET max_replication_slots = 10;');
  console.log('SELECT pg_reload_conf();');
  console.log('\n⚠️  Then RESTART PostgreSQL server for wal_level to take effect\n');
  
  const primaryInfo = parseDatabaseUrlLocal(process.env.DATABASE_URL1);
  const replicationUser = process.env.REPLICATION_USER || 'replicator';
  const replicationPassword = process.env.REPLICATION_PASSWORD || 'replicator_password';
  
  if (primaryInfo) {
    console.log('📋 Step 2: Create Replication User\n');
    console.log(`CREATE USER ${replicationUser} WITH REPLICATION PASSWORD '${replicationPassword}';`);
    console.log(`GRANT CONNECT ON DATABASE ${primaryInfo.database} TO ${replicationUser};`);
    console.log(`GRANT USAGE ON SCHEMA public TO ${replicationUser};`);
    console.log(`GRANT SELECT ON ALL TABLES IN SCHEMA public TO ${replicationUser};`);
    console.log(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO ${replicationUser};`);
    console.log('\n');
    
    console.log('📋 Step 3: Create Publication (on PRIMARY)\n');
    console.log('CREATE PUBLICATION ecommerce_pub FOR ALL TABLES;');
    console.log('-- Or for specific tables:');
    console.log('CREATE PUBLICATION ecommerce_pub FOR TABLE');
    console.log('  categories, products, inventory, orders, order_items, payments;');
    console.log('\n');
    
    const replica1Info = parseDatabaseUrlLocal(process.env.DATABASE_URL2);
    const replica2Info = parseDatabaseUrlLocal(process.env.DATABASE_URL3);
    
    if (replica1Info) {
      console.log('📋 Step 4: Create Subscription on REPLICA 1\n');
      console.log(`-- Connect to REPLICA 1 database (${replica1Info.database})`);
      console.log(`CREATE SUBSCRIPTION sub_replica1`);
      console.log(`CONNECTION 'host=${primaryInfo.host} port=${primaryInfo.port} dbname=${primaryInfo.database} user=${replicationUser} password=${replicationPassword}'`);
      console.log(`PUBLICATION ecommerce_pub`);
      console.log(`WITH (copy_data = true, create_slot = true, enabled = true);`);
      console.log('\n');
    }
    
    if (replica2Info) {
      console.log('📋 Step 5: Create Subscription on REPLICA 2\n');
      console.log(`-- Connect to REPLICA 2 database (${replica2Info.database})`);
      console.log(`CREATE SUBSCRIPTION sub_replica2`);
      console.log(`CONNECTION 'host=${primaryInfo.host} port=${primaryInfo.port} dbname=${primaryInfo.database} user=${replicationUser} password=${replicationPassword}'`);
      console.log(`PUBLICATION ecommerce_pub`);
      console.log(`WITH (copy_data = true, create_slot = true, enabled = true);`);
      console.log('\n');
    }
  }
  
  console.log('='.repeat(60));
  console.log('✅ After completing these steps, run: npm run setup-replication');
  console.log('='.repeat(60));
}

if (require.main === module) {
  generateSQL();
}

module.exports = { generateSQL };

