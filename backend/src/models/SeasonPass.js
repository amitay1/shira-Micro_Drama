const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Season Pass Model
 * Represents a one-time purchase for full season access
 */
const SeasonPass = sequelize.define('SeasonPass', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  seriesId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'series',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  orderId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  transactionId: {
    type: DataTypes.STRING,
    unique: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'expired', 'refunded', 'failed'),
    defaultValue: 'pending',
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'ILS',
    allowNull: false,
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  finalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  couponCode: {
    type: DataTypes.STRING,
  },
  paymentMethod: {
    type: DataTypes.STRING, // 'credit_card', 'apple_pay', 'google_pay'
  },
  paymentProvider: {
    type: DataTypes.STRING, // 'tranzila', 'cardcom', 'pelecard'
  },
  customerEmail: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  customerPhone: {
    type: DataTypes.STRING,
  },
  invoiceUrl: {
    type: DataTypes.STRING,
  },
  invoiceNumber: {
    type: DataTypes.STRING,
  },
  purchasedAt: {
    type: DataTypes.DATE,
  },
  expiresAt: {
    type: DataTypes.DATE,
  },
  refundedAt: {
    type: DataTypes.DATE,
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
}, {
  tableName: 'season_passes',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['series_id'] },
    { fields: ['order_id'] },
    { fields: ['status'] },
    { fields: ['customer_email'] },
  ],
});

module.exports = SeasonPass;
