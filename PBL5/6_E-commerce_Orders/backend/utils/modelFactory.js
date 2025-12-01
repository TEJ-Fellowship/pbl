/**
 * Model Factory System
 * Creates model instances bound to specific Sequelize connections
 * Enables proper read/write split by using req.db from dbRouter middleware
 */

const { DataTypes } = require('sequelize');
const { sequelizePrimary, sequelizeReplica1, sequelizeReplica2 } = require('./db');

/**
 * Product model factory
 * Creates Product model bound to specified Sequelize instance
 */
const createProductModel = (sequelize) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    discount_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      }
    },
    sku: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    brand: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0,
      validate: {
        min: 0,
        max: 5
      }
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    weight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    dimensions: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    thumbnail_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    images: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    tags: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    warranty_information: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    shipping_information: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    availability_status: {
      type: DataTypes.STRING(50),
      defaultValue: 'In Stock'
    },
    return_policy: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    minimum_order_quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      validate: {
        min: 1
      }
    },
    meta: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'products',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['category_id'] },
      { fields: ['sku'] },
      { fields: ['price'] },
      { fields: ['stock'] },
      { fields: ['availability_status'] },
      { fields: ['created_at'] }
    ]
  });

  return Product;
};

/**
 * Category model factory
 */
const createCategoryModel = (sequelize) => {
  const Category = sequelize.define('Category', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    parent_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      }
    }
  }, {
    tableName: 'categories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Self-referential relationship
  Category.hasMany(Category, { foreignKey: 'parent_id', as: 'children' });
  Category.belongsTo(Category, { foreignKey: 'parent_id', as: 'parent' });

  return Category;
};

/**
 * Inventory model factory
 */
const createInventoryModel = (sequelize) => {
  const Inventory = sequelize.define('Inventory', {
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

  Inventory.prototype.getAvailableQuantity = function() {
    return this.quantity - this.reserved_quantity;
  };

  return Inventory;
};

/**
 * Get models for a specific Sequelize instance
 * Sets up relationships between models
 */
const getModels = (sequelize) => {
  const Product = createProductModel(sequelize);
  const Category = createCategoryModel(sequelize);
  const Inventory = createInventoryModel(sequelize);

  // Set up relationships
  Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
  Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
  Inventory.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
  Product.hasOne(Inventory, { foreignKey: 'product_id', as: 'inventory' });

  return {
    Product,
    Category,
    Inventory
  };
};

/**
 * Get models from request (uses req.db from dbRouter middleware)
 * Falls back to primary if req.db not set
 */
const getModelsFromRequest = (req, { getPrimary } = require('./db')) => {
  const db = req.db || getPrimary();
  return getModels(db);
};

// Export default models (for backward compatibility)
const defaultModels = getModels(sequelizePrimary);

module.exports = {
  createProductModel,
  createCategoryModel,
  createInventoryModel,
  getModels,
  getModelsFromRequest,
  // Default models (backward compatibility)
  Product: defaultModels.Product,
  Category: defaultModels.Category,
  Inventory: defaultModels.Inventory,
};

