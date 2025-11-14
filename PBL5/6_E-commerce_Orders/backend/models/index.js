// Export all models
const Category = require('./Category');
const Product = require('./Product');
const Inventory = require('./Inventory');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Payment = require('./Payment');

// Define all relationships
// (Relationships are already defined in individual model files)

module.exports = {
  Category,
  Product,
  Inventory,
  Order,
  OrderItem,
  Payment
};

