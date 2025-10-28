const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// ====================
// CoinTransaction Model
// ====================
const CoinTransaction = sequelize.define('CoinTransaction', {
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
    type: DataTypes.ENUM('purchase', 'spend', 'reward', 'refund', 'admin_adjustment'),
    allowNull: false
  },
  
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  
  balance_before: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Balance before this transaction'
  },
  
  balance_after: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Balance after this transaction'
  },
  
  reason: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Description of transaction'
  },
  
  reference_type: {
    type: DataTypes.ENUM('episode', 'series', 'purchase', 'promotion', 'daily_reward', 'achievement', 'other'),
    allowNull: true
  },
  
  reference_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID of related resource (episode, purchase, etc.)'
  },
  
  platform: {
    type: DataTypes.ENUM('ios', 'android', 'web', 'admin'),
    allowNull: true
  },
  
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled', 'refunded'),
    defaultValue: 'completed'
  },
  
  payment_transaction_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Related payment/purchase transaction ID'
  },
  
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional transaction data'
  }
}, {
  tableName: 'coin_transactions',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['type'] },
    { fields: ['reference_type'] },
    { fields: ['reference_id'] },
    { fields: ['status'] },
    { fields: ['created_at'] },
    { fields: ['payment_transaction_id'] }
  ]
});

// ====================
// Class Methods
// ====================

/**
 * Create purchase transaction
 */
CoinTransaction.createPurchase = async function(userId, amount, paymentTransactionId, platform = 'web') {
  const CoinBalance = require('./CoinBalance');
  const balance = await CoinBalance.getOrCreate(userId);
  
  const transaction = await this.create({
    user_id: userId,
    type: 'purchase',
    amount,
    balance_before: balance.balance,
    balance_after: balance.balance + amount,
    reason: `Purchased ${amount} coins`,
    platform,
    payment_transaction_id: paymentTransactionId,
    status: 'completed'
  });
  
  await balance.addCoins(amount, 'purchase');
  
  return transaction;
};

/**
 * Create spend transaction
 */
CoinTransaction.createSpend = async function(userId, amount, referenceType, referenceId, reason) {
  const CoinBalance = require('./CoinBalance');
  const balance = await CoinBalance.getOrCreate(userId);
  
  if (!balance.hasSufficientBalance(amount)) {
    throw new Error('Insufficient coin balance');
  }
  
  const transaction = await this.create({
    user_id: userId,
    type: 'spend',
    amount,
    balance_before: balance.balance,
    balance_after: balance.balance - amount,
    reason,
    reference_type: referenceType,
    reference_id: referenceId,
    status: 'completed'
  });
  
  await balance.spendCoins(amount);
  
  return transaction;
};

/**
 * Create reward transaction
 */
CoinTransaction.createReward = async function(userId, amount, reason, referenceType = 'other', referenceId = null) {
  const CoinBalance = require('./CoinBalance');
  const balance = await CoinBalance.getOrCreate(userId);
  
  const transaction = await this.create({
    user_id: userId,
    type: 'reward',
    amount,
    balance_before: balance.balance,
    balance_after: balance.balance + amount,
    reason,
    reference_type: referenceType,
    reference_id: referenceId,
    status: 'completed'
  });
  
  await balance.addCoins(amount, 'reward');
  
  return transaction;
};

/**
 * Get user transaction history
 */
CoinTransaction.getUserHistory = async function(userId, options = {}) {
  return await this.findAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']],
    ...options
  });
};

// ====================
// Exports
// ====================
module.exports = CoinTransaction;
