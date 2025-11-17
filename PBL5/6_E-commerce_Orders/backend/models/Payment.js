const { DataTypes } = require('sequelize');
const { sequelizePrimary } = require('../utils/db');
const Order = require('./Order');

const Payment = sequelizePrimary.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  order_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  payment_method: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'succeeded', 'failed', 'refunded'),
    defaultValue: 'pending',
    allowNull: false
  },
  transaction_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  failure_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  processed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'payments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['order_id'] },
    { fields: ['status'] },
    { fields: ['transaction_id'] }
  ]
});

// Relationships
Payment.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
Order.hasOne(Payment, { foreignKey: 'order_id', as: 'payment' });

module.exports = Payment;

