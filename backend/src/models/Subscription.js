const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// ====================
// Subscription Model
// ====================
const Subscription = sequelize.define('Subscription', {
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
  
  plan_type: {
    type: DataTypes.ENUM('free', 'basic', 'premium', 'vip'),
    defaultValue: 'free',
    comment: 'Subscription tier'
  },
  
  status: {
    type: DataTypes.ENUM('active', 'cancelled', 'expired', 'pending', 'suspended', 'refunded'),
    defaultValue: 'pending'
  },
  
  platform: {
    type: DataTypes.ENUM('ios', 'android', 'web', 'admin'),
    allowNull: false,
    comment: 'Platform where subscription was purchased'
  },
  
  transaction_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Store transaction/receipt ID'
  },
  
  original_transaction_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Original transaction ID for renewals'
  },
  
  product_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Store product ID'
  },
  
  start_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  
  end_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  
  renewal_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Next scheduled renewal date'
  },
  
  auto_renew: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether subscription will auto-renew'
  },
  
  cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  cancel_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD'
  },
  
  billing_period: {
    type: DataTypes.ENUM('monthly', 'yearly', 'lifetime'),
    defaultValue: 'monthly'
  },
  
  trial_eligible: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  trial_start_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  trial_end_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  is_trial: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  grace_period_expires: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Grace period for failed payments'
  },
  
  promo_code: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  
  discount_percentage: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  
  receipt_data: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Store receipt/verification data'
  },
  
  last_verified_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Last time receipt was verified with store'
  },
  
  features: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Features included in this subscription tier'
  },
  
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'subscriptions',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['status'] },
    { fields: ['platform'] },
    { fields: ['plan_type'] },
    { fields: ['transaction_id'] },
    { fields: ['original_transaction_id'] },
    { fields: ['end_date'] },
    { fields: ['renewal_date'] },
    { fields: ['auto_renew'] },
    { fields: ['created_at'] },
    {
      fields: ['user_id', 'status'],
      name: 'user_active_subscription'
    }
  ]
});

// ====================
// Instance Methods
// ====================

/**
 * Check if subscription is currently active
 */
Subscription.prototype.isActive = function() {
  if (this.status !== 'active') return false;
  const now = new Date();
  return new Date(this.end_date) > now;
};

/**
 * Check if subscription is in trial period
 */
Subscription.prototype.isInTrial = function() {
  if (!this.is_trial) return false;
  const now = new Date();
  return this.trial_end_date && new Date(this.trial_end_date) > now;
};

/**
 * Check if in grace period
 */
Subscription.prototype.isInGracePeriod = function() {
  if (!this.grace_period_expires) return false;
  return new Date(this.grace_period_expires) > new Date();
};

/**
 * Cancel subscription
 */
Subscription.prototype.cancel = async function(reason = null) {
  this.status = 'cancelled';
  this.cancelled_at = new Date();
  this.cancel_reason = reason;
  this.auto_renew = false;
  await this.save();
};

/**
 * Renew subscription
 */
Subscription.prototype.renew = async function(newEndDate, transactionId) {
  this.status = 'active';
  this.start_date = this.end_date;
  this.end_date = newEndDate;
  this.renewal_date = this.calculateRenewalDate(newEndDate);
  this.transaction_id = transactionId;
  this.last_verified_at = new Date();
  await this.save();
};

/**
 * Calculate next renewal date
 */
Subscription.prototype.calculateRenewalDate = function(endDate) {
  const end = new Date(endDate || this.end_date);
  
  if (this.billing_period === 'monthly') {
    return new Date(end.setMonth(end.getMonth() + 1));
  } else if (this.billing_period === 'yearly') {
    return new Date(end.setFullYear(end.getFullYear() + 1));
  }
  
  return null;
};

/**
 * Get days remaining
 */
Subscription.prototype.getDaysRemaining = function() {
  const now = new Date();
  const end = new Date(this.end_date);
  const diff = end - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// ====================
// Hooks
// ====================

/**
 * Set renewal date before creating
 */
Subscription.beforeCreate((subscription) => {
  if (!subscription.renewal_date && subscription.auto_renew) {
    subscription.renewal_date = subscription.calculateRenewalDate();
  }
});

// ====================
// Class Methods
// ====================

/**
 * Get active subscription for user
 */
Subscription.getActiveSubscription = async function(userId) {
  return await this.findOne({
    where: {
      user_id: userId,
      status: 'active',
      end_date: {
        [sequelize.Sequelize.Op.gt]: new Date()
      }
    },
    order: [['end_date', 'DESC']]
  });
};

/**
 * Get subscriptions expiring soon
 */
Subscription.getExpiringSoon = async function(days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return await this.findAll({
    where: {
      status: 'active',
      auto_renew: false,
      end_date: {
        [sequelize.Sequelize.Op.between]: [new Date(), futureDate]
      }
    }
  });
};

/**
 * Check if user has any active subscription
 */
Subscription.hasActiveSubscription = async function(userId) {
  const subscription = await this.getActiveSubscription(userId);
  return subscription !== null;
};

// ====================
// Exports
// ====================
module.exports = Subscription;
