const { DataTypes } = require('sequelize');
const { sequelizePrimary } = require('../utils/db');

const Order = sequelizePrimary.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  session_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Guest session identifier'
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'),
    defaultValue: 'pending',
    allowNull: false
  },
  shipping_address: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'processing', 'succeeded', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  payment_method: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  payment_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  shipping_carrier: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  tracking_number: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  estimated_delivery_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  confirmed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  shipped_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  delivered_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['status'] },
    { fields: ['session_id'] },
    { fields: ['created_at'] },
    { fields: ['payment_status'] },
    { fields: ['status', 'created_at'] }
  ]
});

module.exports = Order;

