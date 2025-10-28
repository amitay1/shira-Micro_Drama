const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// ====================
// Purchase Model
// ====================
const Purchase = sequelize.define('Purchase', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  
  type: {
    type: DataTypes.ENUM('coins', 'subscription', 'episode'),
    allowNull: false
  },
  
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD'
  },
  
  platform: {
    type: DataTypes.ENUM('ios', 'android', 'web'),
    allowNull: false
  },
  
  transaction_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  
  original_transaction_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  
  product_id: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  
  receipt_data: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded', 'cancelled'),
    defaultValue: 'pending'
  },
  
  payment_method: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  
  device_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  refunded_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  refund_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'purchases',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['type'] },
    { fields: ['platform'] },
    { fields: ['transaction_id'], unique: true },
    { fields: ['status'] },
    { fields: ['created_at'] }
  ]
});

module.exports = Purchase;
