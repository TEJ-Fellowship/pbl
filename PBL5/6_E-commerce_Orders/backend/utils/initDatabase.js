const { sequelizePrimary } = require('./db');
const fs = require('fs');
const path = require('path');

/**
 * Initialize database - create tables if they don't exist
 * Uses SQL file to ensure generated columns and constraints are created correctly
 */
const initDatabase = async () => {
  try {
    console.log('🔄 Initializing database tables...');
    
    // Check if tables already exist
    const [results] = await sequelizePrimary.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('products', 'categories', 'inventory', 'orders', 'order_items', 'payments')
    `);
    
    if (results.length > 0) {
      console.log('✅ Database tables already exist, skipping creation');
      return true;
    }
    
    // Read and execute SQL schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.warn('⚠️  Schema file not found, using Sequelize sync instead...');
      const { Category, Product, Inventory, Order, OrderItem, Payment } = require('../models');
      await sequelizePrimary.sync({ alter: false });
      console.log('✅ Database tables initialized using Sequelize sync');
      return true;
    }
    
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
    
    for (const statement of statements) {
      if (statement.length > 0) {
        try {
          await sequelizePrimary.query(statement);
        } catch (err) {
          // Ignore "already exists" errors
          if (!err.message.includes('already exists') && 
              !err.message.includes('duplicate') &&
              !err.message.includes('does not exist')) {
            console.warn('SQL execution warning:', err.message.substring(0, 100));
          }
        }
      }
    }
    
    console.log('✅ Database tables initialized successfully from SQL schema');
    return true;
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    // Fallback to Sequelize sync if SQL fails
    try {
      console.log('🔄 Falling back to Sequelize sync...');
      const { Category, Product, Inventory, Order, OrderItem, Payment } = require('../models');
      await sequelizePrimary.sync({ alter: false });
      console.log('✅ Database tables initialized using Sequelize sync (fallback)');
      return true;
    } catch (syncError) {
      throw syncError;
    }
  }
};

module.exports = { initDatabase };

