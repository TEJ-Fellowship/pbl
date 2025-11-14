/**
 * One-time Data Sync Script
 * Syncs data from PRIMARY to REPLICAS (for initial setup or recovery)
 */

require('dotenv').config();
const { sequelizePrimary, sequelizeReplica1, sequelizeReplica2 } = require('../utils/db');
const { Product, Category, Inventory, Order, OrderItem, Payment } = require('../models');

/**
 * Get Sequelize model for table name
 */
function getModelForTable(tableName) {
  const modelMap = {
    'categories': Category,
    'products': Product,
    'inventory': Inventory,
    'orders': Order,
    'order_items': OrderItem,
    'payments': Payment
  };
  return modelMap[tableName] || null;
}

/**
 * Check if table exists on replica
 */
async function tableExists(sequelizeReplica, tableName) {
  try {
    const [results] = await sequelizeReplica.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )
    `, { bind: [tableName] });
    return results[0].exists;
  } catch (error) {
    return false;
  }
}

/**
 * Create tables on replica if they don't exist using Sequelize sync
 */
async function ensureTablesExist(sequelizeReplica, replicaName) {
  try {
    console.log(`\n🔧 Ensuring tables exist on ${replicaName}...`);
    
    // Check if any tables exist
    const [tables] = await sequelizeReplica.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('categories', 'products', 'inventory', 'orders', 'order_items', 'payments')
    `);
    
    if (tables.length === 0) {
      console.log(`   ⚠️  No tables found on ${replicaName}, creating schema using Sequelize...`);
      
      // Create models bound to replica connection
      const { DataTypes } = require('sequelize');
      
      // Enable UUID extension first
      try {
        await sequelizeReplica.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      } catch (extErr) {
        // Extension might already exist or not be needed
        console.log(`   ℹ️  UUID extension: ${extErr.message.includes('already exists') ? 'already exists' : 'note: ' + extErr.message.substring(0, 50)}`);
      }
      
      // Define models with replica connection
      const ReplicaCategory = sequelizeReplica.define('Category', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        name: { type: DataTypes.STRING(255), allowNull: false },
        slug: { type: DataTypes.STRING(255), allowNull: false, unique: true },
        description: { type: DataTypes.TEXT },
        parent_id: { type: DataTypes.UUID, references: { model: 'categories', key: 'id' } },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
      }, { tableName: 'categories', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
      
      const ReplicaProduct = sequelizeReplica.define('Product', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        title: { type: DataTypes.STRING(500), allowNull: false },
        description: { type: DataTypes.TEXT },
        category_id: { type: DataTypes.UUID, references: { model: 'categories', key: 'id' } },
        price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        discount_percentage: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
        sku: { type: DataTypes.STRING(100), allowNull: false, unique: true },
        brand: { type: DataTypes.STRING(255) },
        rating: { type: DataTypes.DECIMAL(3, 2), defaultValue: 0 },
        stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        weight: { type: DataTypes.DECIMAL(10, 2) },
        dimensions: { type: DataTypes.JSONB },
        image_url: { type: DataTypes.STRING(500) },
        thumbnail_url: { type: DataTypes.STRING(500) },
        images: { type: DataTypes.JSONB },
        tags: { type: DataTypes.JSONB },
        warranty_information: { type: DataTypes.TEXT },
        shipping_information: { type: DataTypes.TEXT },
        availability_status: { type: DataTypes.STRING(50), defaultValue: 'In Stock' },
        return_policy: { type: DataTypes.TEXT },
        minimum_order_quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
        meta: { type: DataTypes.JSONB },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
      }, { tableName: 'products', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
      
      const ReplicaInventory = sequelizeReplica.define('Inventory', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        product_id: { type: DataTypes.UUID, allowNull: false, unique: true, references: { model: 'products', key: 'id' } },
        warehouse_id: { type: DataTypes.UUID },
        quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        reserved_quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        low_stock_threshold: { type: DataTypes.INTEGER, defaultValue: 10 },
        reorder_point: { type: DataTypes.INTEGER, defaultValue: 20 },
        updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
      }, { tableName: 'inventory', timestamps: false });
      
      const ReplicaOrder = sequelizeReplica.define('Order', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        session_id: { type: DataTypes.STRING(255) },
        total_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        status: { type: DataTypes.STRING(50), defaultValue: 'pending' },
        shipping_address: { type: DataTypes.JSONB },
        payment_status: { type: DataTypes.STRING(50), defaultValue: 'pending' },
        payment_method: { type: DataTypes.STRING(50) },
        payment_id: { type: DataTypes.STRING(255) },
        shipping_carrier: { type: DataTypes.STRING(100) },
        tracking_number: { type: DataTypes.STRING(255) },
        estimated_delivery_date: { type: DataTypes.DATE },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        confirmed_at: { type: DataTypes.DATE },
        shipped_at: { type: DataTypes.DATE },
        delivered_at: { type: DataTypes.DATE },
        cancelled_at: { type: DataTypes.DATE }
      }, { tableName: 'orders', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
      
      const ReplicaOrderItem = sequelizeReplica.define('OrderItem', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        order_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'orders', key: 'id' } },
        product_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'products', key: 'id' } },
        quantity: { type: DataTypes.INTEGER, allowNull: false },
        price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        discount_percentage: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
        subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
      }, { tableName: 'order_items', timestamps: true, createdAt: 'created_at', updatedAt: false });
      
      const ReplicaPayment = sequelizeReplica.define('Payment', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        order_id: { type: DataTypes.UUID, allowNull: false, unique: true, references: { model: 'orders', key: 'id' } },
        amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        currency: { type: DataTypes.STRING(3), defaultValue: 'USD' },
        payment_method: { type: DataTypes.STRING(50), allowNull: false },
        status: { type: DataTypes.STRING(50), defaultValue: 'pending' },
        transaction_id: { type: DataTypes.STRING(255) },
        payment_provider: { type: DataTypes.STRING(50) },
        metadata: { type: DataTypes.JSONB },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        processed_at: { type: DataTypes.DATE }
      }, { tableName: 'payments', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
      
      // Set up associations
      ReplicaCategory.hasMany(ReplicaProduct, { foreignKey: 'category_id', as: 'products' });
      ReplicaProduct.belongsTo(ReplicaCategory, { foreignKey: 'category_id', as: 'category' });
      ReplicaProduct.hasOne(ReplicaInventory, { foreignKey: 'product_id', as: 'inventory' });
      ReplicaInventory.belongsTo(ReplicaProduct, { foreignKey: 'product_id', as: 'product' });
      ReplicaOrder.hasMany(ReplicaOrderItem, { foreignKey: 'order_id', as: 'items' });
      ReplicaOrderItem.belongsTo(ReplicaOrder, { foreignKey: 'order_id', as: 'order' });
      ReplicaOrderItem.belongsTo(ReplicaProduct, { foreignKey: 'product_id', as: 'product' });
      ReplicaOrder.hasOne(ReplicaPayment, { foreignKey: 'order_id', as: 'payment' });
      ReplicaPayment.belongsTo(ReplicaOrder, { foreignKey: 'order_id', as: 'order' });
      
      // Sync tables in order (respecting foreign keys)
      await ReplicaCategory.sync({ alter: false });
      await ReplicaProduct.sync({ alter: false });
      await ReplicaInventory.sync({ alter: false });
      await ReplicaOrder.sync({ alter: false });
      await ReplicaOrderItem.sync({ alter: false });
      await ReplicaPayment.sync({ alter: false });
      
      console.log(`   ✅ Tables created on ${replicaName}`);
    } else {
      console.log(`   ✅ Tables already exist on ${replicaName} (${tables.length} tables)`);
    }
    
    return true;
  } catch (error) {
    console.error(`   ❌ Failed to create tables on ${replicaName}:`, error.message);
    throw error;
  }
}

/**
 * Sync table data from primary to replica
 */
async function syncTable(sequelizeReplica, tableName, primaryData) {
  const transaction = await sequelizeReplica.transaction();
  
  try {
    console.log(`\n🔄 Syncing ${tableName}...`);
    
    // Check if table exists
    const exists = await tableExists(sequelizeReplica, tableName);
    if (!exists) {
      console.log(`   ⚠️  Table ${tableName} does not exist, skipping...`);
      await transaction.commit();
      return { synced: 0, skipped: 0 };
    }
    
    // Get current count on replica
    const [replicaCount] = await sequelizeReplica.query(`SELECT COUNT(*) as count FROM ${tableName}`, { transaction });
    const currentCount = parseInt(replicaCount[0].count);
    
    if (currentCount === primaryData.length && primaryData.length > 0) {
      console.log(`   ✅ ${tableName} already in sync (${currentCount} rows)`);
      await transaction.commit();
      return { synced: 0, skipped: currentCount };
    }
    
    console.log(`   Primary: ${primaryData.length} rows, Replica: ${currentCount} rows`);
    
    // Clear replica table (for one-time sync)
    await sequelizeReplica.query(`TRUNCATE TABLE ${tableName} CASCADE`, { transaction });
    console.log(`   Cleared replica ${tableName}`);
    
    if (primaryData.length === 0) {
      console.log(`   ⚠️  No data to sync for ${tableName}`);
      await transaction.commit();
      return { synced: 0, skipped: 0 };
    }
    
    // Insert data in batches using Sequelize models
    const batchSize = 100;
    let synced = 0;
    const Model = getModelForTable(tableName);
    
    for (let i = 0; i < primaryData.length; i += batchSize) {
      const batch = primaryData.slice(i, i + batchSize);
      
      if (Model) {
        // Use Sequelize bulkCreate
        await Model.bulkCreate(batch, {
          ignoreDuplicates: true,
          transaction
        });
      } else {
        // Fallback to parameterized SQL
        const columns = Object.keys(batch[0]);
        const placeholders = batch.map((_, idx) => {
          const start = idx * columns.length;
          return `(${columns.map((_, j) => `$${start + j + 1}`).join(', ')})`;
        }).join(', ');
        
        const values = batch.flatMap(row => 
          columns.map(col => {
            const val = row[col];
            if (val === null) return null;
            if (typeof val === 'object') return JSON.stringify(val);
            return val;
          })
        );
        
        const insertSQL = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${placeholders} ON CONFLICT DO NOTHING`;
        await sequelizeReplica.query(insertSQL, { bind: values, transaction });
      }
      
      synced += batch.length;
      console.log(`   Synced ${Math.min(i + batchSize, primaryData.length)}/${primaryData.length} rows...`);
    }
    
    await transaction.commit();
    console.log(`   ✅ ${tableName} sync completed (${synced} rows)`);
    return { synced, skipped: 0 };
    
  } catch (error) {
    await transaction.rollback();
    console.error(`   ❌ Failed to sync ${tableName}:`, error.message);
    throw error;
  }
}

/**
 * Sync all tables from primary to replicas
 */
async function syncAllTables() {
  try {
    console.log('🔄 Starting one-time data sync from PRIMARY to REPLICAS\n');
    console.log('⚠️  This will TRUNCATE and repopulate replica tables!');
    
    // Ensure tables exist on replicas first
    await ensureTablesExist(sequelizeReplica1, 'REPLICA 1');
    await ensureTablesExist(sequelizeReplica2, 'REPLICA 2');
    
    // Get all data from primary
    console.log('\n📥 Fetching data from PRIMARY...');
    
    const categories = await Category.findAll({ raw: true });
    const products = await Product.findAll({ raw: true });
    const inventory = await Inventory.findAll({ raw: true });
    const orders = await Order.findAll({ raw: true });
    const orderItems = await OrderItem.findAll({ raw: true });
    const payments = await Payment.findAll({ raw: true });
    
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Products: ${products.length}`);
    console.log(`   Inventory: ${inventory.length}`);
    console.log(`   Orders: ${orders.length}`);
    console.log(`   Order Items: ${orderItems.length}`);
    console.log(`   Payments: ${payments.length}`);
    
    // Sync to Replica 1
    console.log('\n' + '='.repeat(50));
    console.log('📤 Syncing to REPLICA 1...');
    console.log('='.repeat(50));
    
    await syncTable(sequelizeReplica1, 'categories', categories);
    await syncTable(sequelizeReplica1, 'products', products);
    await syncTable(sequelizeReplica1, 'inventory', inventory);
    await syncTable(sequelizeReplica1, 'orders', orders);
    await syncTable(sequelizeReplica1, 'order_items', orderItems);
    await syncTable(sequelizeReplica1, 'payments', payments);
    
    // Sync to Replica 2
    console.log('\n' + '='.repeat(50));
    console.log('📤 Syncing to REPLICA 2...');
    console.log('='.repeat(50));
    
    await syncTable(sequelizeReplica2, 'categories', categories);
    await syncTable(sequelizeReplica2, 'products', products);
    await syncTable(sequelizeReplica2, 'inventory', inventory);
    await syncTable(sequelizeReplica2, 'orders', orders);
    await syncTable(sequelizeReplica2, 'order_items', orderItems);
    await syncTable(sequelizeReplica2, 'payments', payments);
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Data sync completed!');
    console.log('='.repeat(50));
    
    // Verify
    console.log('\n📊 Verification:');
    const [rep1Count] = await sequelizeReplica1.query('SELECT COUNT(*) as count FROM products');
    const [rep2Count] = await sequelizeReplica2.query('SELECT COUNT(*) as count FROM products');
    console.log(`   Replica 1 products: ${rep1Count[0].count}`);
    console.log(`   Replica 2 products: ${rep2Count[0].count}`);
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  (async () => {
    try {
      await sequelizePrimary.authenticate();
      await sequelizeReplica1.authenticate();
      await sequelizeReplica2.authenticate();
      
      await syncAllTables();
      
      process.exit(0);
    } catch (error) {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    }
  })();
}

module.exports = { syncAllTables };

