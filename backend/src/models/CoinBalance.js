const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// ====================
// CoinBalance Model
// ====================
const CoinBalance = sequelize.define('CoinBalance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  
  balance: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    },
    comment: 'Current coin balance'
  },
  
  total_earned: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total coins earned (purchases + rewards)'
  },
  
  total_spent: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total coins spent on content'
  },
  
  total_purchased: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total coins purchased with real money'
  },
  
  total_rewarded: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total coins from rewards/promotions'
  },
  
  last_purchase_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  last_spend_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'coin_balances',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id'], unique: true },
    { fields: ['balance'] },
    { fields: ['updated_at'] }
  ]
});

// ====================
// Instance Methods
// ====================

/**
 * Add coins to balance
 */
CoinBalance.prototype.addCoins = async function(amount, type = 'purchase') {
  this.balance += amount;
  this.total_earned += amount;
  
  if (type === 'purchase') {
    this.total_purchased += amount;
    this.last_purchase_at = new Date();
  } else if (type === 'reward') {
    this.total_rewarded += amount;
  }
  
  await this.save();
  return this.balance;
};

/**
 * Spend coins from balance
 */
CoinBalance.prototype.spendCoins = async function(amount) {
  if (this.balance < amount) {
    throw new Error('Insufficient coin balance');
  }
  
  this.balance -= amount;
  this.total_spent += amount;
  this.last_spend_at = new Date();
  
  await this.save();
  return this.balance;
};

/**
 * Check if has sufficient balance
 */
CoinBalance.prototype.hasSufficientBalance = function(amount) {
  return this.balance >= amount;
};

// ====================
// Class Methods
// ====================

/**
 * Get or create balance for user
 */
CoinBalance.getOrCreate = async function(userId) {
  const [balance, created] = await this.findOrCreate({
    where: { user_id: userId },
    defaults: {
      user_id: userId,
      balance: 0,
      total_earned: 0,
      total_spent: 0
    }
  });
  
  return balance;
};

/**
 * Get balance for user
 */
CoinBalance.getUserBalance = async function(userId) {
  const balance = await this.findOne({
    where: { user_id: userId }
  });
  
  return balance ? balance.balance : 0;
};

// ====================
// Exports
// ====================
module.exports = CoinBalance;
