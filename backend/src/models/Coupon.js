const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Coupon Model
 * Promotional codes for discounts
 */
const Coupon = sequelize.define('Coupon', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      isUppercase: true,
    },
  },
  seriesId: {
    type: DataTypes.UUID,
    allowNull: true, // null means applies to all series
    references: {
      model: 'series',
      key: 'id',
    },
  },
  discountType: {
    type: DataTypes.ENUM('percentage', 'fixed'),
    allowNull: false,
  },
  discountValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  maxUses: {
    type: DataTypes.INTEGER,
    defaultValue: null, // null = unlimited
  },
  usedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  minPurchaseAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  validFrom: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  validUntil: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
}, {
  tableName: 'coupons',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['code'] },
    { fields: ['is_active'] },
    { fields: ['valid_from', 'valid_until'] },
  ],
});

module.exports = Coupon;
