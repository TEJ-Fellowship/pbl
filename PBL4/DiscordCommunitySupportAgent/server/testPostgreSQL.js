import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * PostgreSQL Connection Test Script
 * Tests PostgreSQL connection and creates database if needed
 */
async function testPostgreSQLConnection() {
  console.log('🐘 Testing PostgreSQL Connection...\n');

  // Test connection parameters
  const host = process.env.POSTGRES_HOST || 'localhost';
  const port = parseInt(process.env.POSTGRES_PORT) || 5432;
  const database = process.env.POSTGRES_DB || 'discord_analytics';
  const user = process.env.POSTGRES_USER || 'postgres';
  const password = process.env.POSTGRES_PASSWORD || 'password';
  const enableSSL = (
    (process.env.POSTGRES_SSL || '').toString().toLowerCase() === 'true' ||
    /\.neon\.tech$/i.test(host)
  );

  const config = {
    host,
    port,
    database,
    user,
    password,
    ssl: enableSSL ? { rejectUnauthorized: false } : undefined
  };

  console.log('📋 Connection Config:');
  console.log(`  Host: ${config.host}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  Database: ${config.database}`);
  console.log(`  User: ${config.user}`);
  console.log(`  Password: ${config.password ? '***' : 'NOT SET'}\n`);

  let pool = null;
  
  try {
    // Test basic connection
    console.log('🔌 Testing basic connection...');
    pool = new Pool(config);
    
    const client = await pool.connect();
    console.log('✅ PostgreSQL connection successful!');
    
    // Test database operations
    console.log('\n📊 Testing database operations...');
    
    // Test simple query
    const result = await client.query('SELECT version()');
    console.log('✅ Database version:', result.rows[0].version);
    
    // Test table creation
    console.log('\n📋 Testing table creation...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Test table created successfully');
    
    // Test insert
    await client.query(`
      INSERT INTO test_table (message) VALUES ('PostgreSQL connection test successful!')
    `);
    console.log('✅ Test data inserted successfully');
    
    // Test select
    const testResult = await client.query('SELECT * FROM test_table ORDER BY id DESC LIMIT 1');
    console.log('✅ Test data retrieved:', testResult.rows[0]);
    
    // Clean up test table
    await client.query('DROP TABLE IF EXISTS test_table');
    console.log('✅ Test table cleaned up');
    
    client.release();
    
    console.log('\n🎉 PostgreSQL is working perfectly!');
    console.log('✅ Connection: OK');
    console.log('✅ Database operations: OK');
    console.log('✅ Ready for analytics tracking');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ PostgreSQL connection failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Troubleshooting:');
      console.log('1. Make sure PostgreSQL is installed and running');
      console.log('2. Check if the service is started');
      console.log('3. Verify the connection parameters in .env file');
    } else if (error.code === '28P01') {
      console.log('\n💡 Troubleshooting:');
      console.log('1. Check username and password in .env file');
      console.log('2. Make sure the user has proper permissions');
    } else if (error.code === '3D000') {
      console.log('\n💡 Troubleshooting:');
      console.log('1. Database does not exist');
      console.log('2. Create the database first or update POSTGRES_DB in .env');
    }
    
    return false;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run the test
testPostgreSQLConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test script failed:', error.message);
    process.exit(1);
  });
