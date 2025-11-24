/**
 * Helper script to find PostgreSQL configuration file location
 * Helps users locate postgresql.conf for manual configuration
 */

require('dotenv').config();
const { sequelizePrimary } = require('../utils/db');

async function findPostgresConfig() {
  try {
    console.log('🔍 Finding PostgreSQL Configuration...\n');
    
    await sequelizePrimary.authenticate();
    console.log('✅ Connected to PRIMARY database\n');
    
    // Try to get config file location
    try {
      const [configFile] = await sequelizePrimary.query("SHOW config_file");
      let configPath = null;
      
      if (Array.isArray(configFile) && configFile.length > 0) {
        configPath = configFile[0].config_file || configFile[0].CONFIG_FILE;
      } else if (configFile && typeof configFile === 'object') {
        configPath = configFile.config_file || configFile.CONFIG_FILE;
      }
      
      if (configPath) {
        console.log('📁 PostgreSQL config file location:');
        console.log(`   ${configPath}\n`);
        
        // Try to get data directory
        try {
          const [dataDir] = await sequelizePrimary.query("SHOW data_directory");
          let dataPath = null;
          
          if (Array.isArray(dataDir) && dataDir.length > 0) {
            dataPath = dataDir[0].data_directory || dataDir[0].DATA_DIRECTORY;
          } else if (dataDir && typeof dataDir === 'object') {
            dataPath = dataDir.data_directory || dataDir.DATA_DIRECTORY;
          }
          
          if (dataPath) {
            console.log('📁 PostgreSQL data directory:');
            console.log(`   ${dataPath}\n`);
          }
        } catch (e) {
          // Ignore
        }
        
        console.log('📝 Configuration needed:');
        console.log('   Add or modify these lines in postgresql.conf:');
        console.log('   wal_level = logical');
        console.log('   max_wal_senders = 10');
        console.log('   max_replication_slots = 10\n');
        
        console.log('💡 After editing, restart PostgreSQL and run: npm run setup-replication\n');
        
        return { configFile: configPath, found: true };
      }
    } catch (error) {
      console.log('⚠️  Could not determine config file location automatically\n');
    }
    
    // Alternative: Check common locations
    console.log('💡 Common PostgreSQL config file locations:');
    console.log('   Linux:');
    console.log('     /etc/postgresql/[version]/main/postgresql.conf');
    console.log('     /var/lib/pgsql/data/postgresql.conf');
    console.log('     /usr/local/pgsql/data/postgresql.conf');
    console.log('   Windows:');
    console.log('     C:\\Program Files\\PostgreSQL\\[version]\\data\\postgresql.conf');
    console.log('   macOS (Homebrew):');
    console.log('     /usr/local/var/postgres/postgresql.conf');
    console.log('     /opt/homebrew/var/postgres/postgresql.conf\n');
    
    console.log('📝 To find your config file, run this SQL as superuser:');
    console.log('   SHOW config_file;\n');
    
    return { found: false };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { found: false, error: error.message };
  }
}

if (require.main === module) {
  findPostgresConfig().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { findPostgresConfig };

