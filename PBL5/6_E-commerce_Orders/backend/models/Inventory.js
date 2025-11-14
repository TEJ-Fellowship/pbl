const { DataTypes } = require('sequelize');
const { sequelizePrimary } = require('../utils/db');
const Product = require('./Product');

const Inventory = sequelizePrimary.define('Inventory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  product_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  warehouse_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  reserved_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  low_stock_threshold: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  reorder_point: {
    type: DataTypes.INTEGER,
    defaultValue: 20
  },
  // Note: available_quantity is a GENERATED column in SQL, not stored
  // We'll calculate it in JavaScript instead
  available_quantity: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.quantity - this.reserved_quantity;
    }
  }
}, {
  tableName: 'inventory',
  timestamps: true,
  updatedAt: 'updated_at',
  createdAt: false,
  hooks: {
    beforeValidate: (inventory) => {
      if (inventory.reserved_quantity > inventory.quantity) {
        throw new Error('Reserved quantity cannot exceed total quantity');
      }
    }
  }
});

// Virtual field for available quantity
Inventory.prototype.getAvailableQuantity = function() {
  return this.quantity - this.reserved_quantity;
};

// Relationships
Inventory.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasOne(Inventory, { foreignKey: 'product_id', as: 'inventory' });

module.exports = Inventory;

