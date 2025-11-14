/**
 * Product Seeder Script
 * Seeds products from products.json into PRIMARY database
 * Handles category mapping and data transformation
 */

require('dotenv').config();
const { sequelizePrimary } = require('../utils/db');
const { Product, Category, Inventory } = require('../models');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Read products.json
const productsPath = path.join(__dirname, '../../docs/products.json');
const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
const products = productsData.products || productsData;

/**
 * Map category string to UUID (create if doesn't exist)
 */
async function getOrCreateCategory(categoryName) {
  if (!categoryName) return null;
  
  const slug = categoryName.toLowerCase().replace(/\s+/g, '-');
  
  let category = await Category.findOne({
    where: { slug }
  });
  
  if (!category) {
    category = await Category.create({
      id: uuidv4(),
      name: categoryName.charAt(0).toUpperCase() + categoryName.slice(1),
      slug: slug
    });
  }
  
  return category.id;
}

/**
 * Transform JSON product to database schema
 */
function transformProduct(jsonProduct) {
  return {
    id: uuidv4(), // Generate UUID (ignore numeric ID from JSON)
    title: jsonProduct.title,
    description: jsonProduct.description || null,
    price: parseFloat(jsonProduct.price) || 0,
    discount_percentage: parseFloat(jsonProduct.discountPercentage) || 0,
    sku: jsonProduct.sku,
    brand: jsonProduct.brand || null,
    rating: parseFloat(jsonProduct.rating) || 0,
    stock: parseInt(jsonProduct.stock) || 0,
    weight: jsonProduct.weight ? parseFloat(jsonProduct.weight) : null,
    dimensions: jsonProduct.dimensions ? {
      width: jsonProduct.dimensions.width,
      height: jsonProduct.dimensions.height,
      depth: jsonProduct.dimensions.depth
    } : null,
    image_url: jsonProduct.images && jsonProduct.images.length > 0 ? jsonProduct.images[0] : null,
    thumbnail_url: jsonProduct.thumbnail || null,
    images: jsonProduct.images || null,
    tags: jsonProduct.tags || null,
    warranty_information: jsonProduct.warrantyInformation || null,
    shipping_information: jsonProduct.shippingInformation || null,
    availability_status: jsonProduct.availabilityStatus || 'In Stock',
    return_policy: jsonProduct.returnPolicy || null,
    minimum_order_quantity: jsonProduct.minimumOrderQuantity || 1,
    meta: jsonProduct.meta || null
  };
}

/**
 * Seed products with idempotent upsert
 */
async function seedProducts() {
  const transaction = await sequelizePrimary.transaction();
  
  try {
    console.log('🔄 Starting product seeding...');
    console.log(`📦 Found ${products.length} products in JSON`);
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    
    // Process products in batches of 50
    const batchSize = 50;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      
      for (const jsonProduct of batch) {
        try {
          // Get or create category
          const categoryId = await getOrCreateCategory(jsonProduct.category);
          
          // Transform product data
          const productData = transformProduct(jsonProduct);
          productData.category_id = categoryId;
          
          // Check if product exists by SKU
          const existingProduct = await Product.findOne({
            where: { sku: productData.sku },
            transaction
          });
          
          let product;
          if (existingProduct) {
            // Update existing product
            await existingProduct.update(productData, { transaction });
            product = existingProduct;
            updated++;
          } else {
            // Create new product
            product = await Product.create(productData, { transaction });
            created++;
          }
          
          // Create or update inventory
          if (productData.stock !== undefined) {
            await Inventory.upsert({
              product_id: product.id,
              quantity: productData.stock,
              reserved_quantity: 0,
              low_stock_threshold: 10,
              reorder_point: 20
            }, {
              conflictFields: ['product_id'],
              transaction
            });
          }
          
        } catch (error) {
          console.error(`❌ Error processing product ${jsonProduct.sku}:`, error.message);
          skipped++;
        }
      }
      
      console.log(`✅ Processed ${Math.min(i + batchSize, products.length)}/${products.length} products...`);
    }
    
    await transaction.commit();
    
    console.log('\n✅ Seeding completed!');
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${created + updated}`);
    
    return { created, updated, skipped };
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

/**
 * Verify seeded data
 */
async function verifySeeding() {
  try {
    const productCount = await Product.count();
    const inventoryCount = await Inventory.count();
    const categoryCount = await Category.count();
    
    console.log('\n📊 Verification:');
    console.log(`   Products: ${productCount}`);
    console.log(`   Inventory records: ${inventoryCount}`);
    console.log(`   Categories: ${categoryCount}`);
    
    // Show sample products
    const samples = await Product.findAll({
      limit: 5,
      include: [
        { model: Category, as: 'category', attributes: ['name'] },
        { model: Inventory, as: 'inventory', attributes: ['quantity', 'reserved_quantity'] }
      ],
      order: [['created_at', 'DESC']]
    });
    
    console.log('\n📦 Sample products:');
    samples.forEach(p => {
      const available = (p.inventory?.quantity || 0) - (p.inventory?.reserved_quantity || 0);
      console.log(`   - ${p.title} (SKU: ${p.sku}, Stock: ${available}, Category: ${p.category?.name || 'N/A'})`);
    });
    
    return { productCount, inventoryCount, categoryCount };
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

// Run seeder if called directly
if (require.main === module) {
  (async () => {
    try {
      await sequelizePrimary.authenticate();
      console.log('✅ Connected to PRIMARY database');
      
      await seedProducts();
      await verifySeeding();
      
      process.exit(0);
    } catch (error) {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    }
  })();
}

module.exports = { seedProducts, verifySeeding };

