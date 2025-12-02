/**
 * Script to apply database indexes for optimal performance
 * Run this after schema.sql to ensure all queries are optimized
 */

const { getPrimary } = require('../utils/db');
const fs = require('fs');
const path = require('path');

async function applyIndexes() {
  try {
    console.log('📊 Applying database indexes for 1K user optimization...');
    
    const sequelize = getPrimary();
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Read indexes SQL file
    const indexesPath = path.join(__dirname, '../database/indexes.sql');
    const indexesSQL = fs.readFileSync(indexesPath, 'utf8');

    // Split by semicolon and execute each statement
    const statements = indexesSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      try {
        // Skip ANALYZE statements for now (can be run separately)
        if (statement.toUpperCase().includes('ANALYZE')) {
          console.log('⏭️  Skipping ANALYZE statement (run separately if needed)');
          continue;
        }

        await sequelize.query(statement, { raw: true });
        successCount++;
        
        // Extract index name for logging
        const indexMatch = statement.match(/CREATE\s+INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i);
        if (indexMatch) {
          console.log(`✅ Created index: ${indexMatch[1]}`);
        }
      } catch (error) {
        // Index might already exist, which is fine
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`ℹ️  Index already exists (skipping)`);
        } else {
          console.error(`❌ Error creating index:`, error.message);
          errorCount++;
        }
      }
    }

    console.log(`\n📊 Index Application Summary:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ⚠️  Errors: ${errorCount}`);
    console.log(`\n✅ Database indexes applied successfully!`);

    // Run ANALYZE to update statistics
    console.log('\n📊 Running ANALYZE to update query planner statistics...');
    const tables = ['products', 'inventory', 'orders', 'order_items', 'payments', 'categories'];
    for (const table of tables) {
      try {
        await sequelize.query(`ANALYZE ${table};`, { raw: true });
        console.log(`✅ Analyzed table: ${table}`);
      } catch (error) {
        console.error(`❌ Error analyzing ${table}:`, error.message);
      }
    }

    console.log('\n✅ All indexes and statistics updated!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to apply indexes:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  applyIndexes();
}

module.exports = { applyIndexes };

