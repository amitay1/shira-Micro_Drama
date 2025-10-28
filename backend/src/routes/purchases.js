const express = require('express');
const router = express.Router();
const Purchase = require('../models/Purchase');
const CoinTransaction = require('../models/CoinTransaction');
const { asyncHandler } = require('../middleware/errorHandler');
const { ValidationError, PaymentError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// ====================
// GET /purchases/coin-packages
// Get available coin packages
// ====================
router.get('/coin-packages', asyncHandler(async (req, res) => {
  const { platform = 'ios' } = req.query;
  
  // Define coin packages
  const packages = {
    ios: [
      {
        id: 'coins_100',
        coins: 100,
        price: 0.99,
        currency: 'USD',
        bonus: 0,
        product_id: 'com.shira.coins.100'
      },
      {
        id: 'coins_500',
        coins: 500,
        price: 4.99,
        currency: 'USD',
        bonus: 50,
        popular: true,
        product_id: 'com.shira.coins.500'
      },
      {
        id: 'coins_1000',
        coins: 1000,
        price: 9.99,
        currency: 'USD',
        bonus: 150,
        product_id: 'com.shira.coins.1000'
      },
      {
        id: 'coins_2500',
        coins: 2500,
        price: 19.99,
        currency: 'USD',
        bonus: 500,
        bestValue: true,
        product_id: 'com.shira.coins.2500'
      },
      {
        id: 'coins_5000',
        coins: 5000,
        price: 49.99,
        currency: 'USD',
        bonus: 1500,
        product_id: 'com.shira.coins.5000'
      }
    ],
    android: [
      {
        id: 'coins_100',
        coins: 100,
        price: 0.99,
        currency: 'USD',
        bonus: 0,
        product_id: 'coins_100'
      },
      {
        id: 'coins_500',
        coins: 500,
        price: 4.99,
        currency: 'USD',
        bonus: 50,
        popular: true,
        product_id: 'coins_500'
      },
      {
        id: 'coins_1000',
        coins: 1000,
        price: 9.99,
        currency: 'USD',
        bonus: 150,
        product_id: 'coins_1000'
      },
      {
        id: 'coins_2500',
        coins: 2500,
        price: 19.99,
        currency: 'USD',
        bonus: 500,
        bestValue: true,
        product_id: 'coins_2500'
      },
      {
        id: 'coins_5000',
        coins: 5000,
        price: 49.99,
        currency: 'USD',
        bonus: 1500,
        product_id: 'coins_5000'
      }
    ]
  };
  
  res.json({
    success: true,
    data: {
      packages: packages[platform] || packages.ios
    }
  });
}));

// ====================
// POST /purchases/coins
// Purchase coins
// ====================
router.post('/coins', asyncHandler(async (req, res) => {
  const { 
    package_id, 
    platform, 
    transaction_id, 
    product_id, 
    receipt_data,
    amount,
    currency = 'USD'
  } = req.body;
  const userId = req.userId;
  
  if (!package_id || !platform || !transaction_id || !product_id) {
    throw new ValidationError('package_id, platform, transaction_id, and product_id are required');
  }
  
  // Check if transaction already processed
  const existingPurchase = await Purchase.findOne({
    where: { transaction_id }
  });
  
  if (existingPurchase) {
    return res.json({
      success: true,
      message: 'Purchase already processed',
      data: { purchase: existingPurchase }
    });
  }
  
  // Get coin package details
  const packages = {
    coins_100: { coins: 100, bonus: 0, price: 0.99 },
    coins_500: { coins: 500, bonus: 50, price: 4.99 },
    coins_1000: { coins: 1000, bonus: 150, price: 9.99 },
    coins_2500: { coins: 2500, bonus: 500, price: 19.99 },
    coins_5000: { coins: 5000, bonus: 1500, price: 49.99 }
  };
  
  const packageInfo = packages[package_id];
  
  if (!packageInfo) {
    throw new ValidationError('Invalid package_id');
  }
  
  // TODO: Verify receipt with store
  // const isValid = await verifyReceipt(platform, receipt_data);
  // if (!isValid) throw new PaymentError('Invalid receipt');
  
  // Create purchase record
  const purchase = await Purchase.create({
    user_id: userId,
    type: 'coins',
    platform,
    transaction_id,
    product_id,
    amount: amount || packageInfo.price,
    currency,
    quantity: 1,
    status: 'completed',
    receipt_data: receipt_data || {},
    verified_at: new Date(),
    ip_address: req.ip,
    device_id: req.body.device_id
  });
  
  // Add coins to user balance
  const totalCoins = packageInfo.coins + packageInfo.bonus;
  await CoinTransaction.createPurchase(
    userId,
    totalCoins,
    transaction_id,
    platform
  );
  
  logger.logPayment(userId, packageInfo.price, currency, 'completed');
  logger.logUserAction(userId, 'COINS_PURCHASE', {
    packageId: package_id,
    coins: totalCoins,
    transactionId: transaction_id
  });
  
  res.json({
    success: true,
    message: 'Coins purchased successfully',
    data: {
      purchase,
      coinsAdded: totalCoins,
      coins: packageInfo.coins,
      bonus: packageInfo.bonus
    }
  });
}));

// ====================
// POST /purchases/verify
// Verify receipt from store
// ====================
router.post('/verify', asyncHandler(async (req, res) => {
  const { platform, receipt_data, transaction_id } = req.body;
  const userId = req.userId;
  
  if (!platform || !receipt_data) {
    throw new ValidationError('platform and receipt_data are required');
  }
  
  // TODO: Implement actual receipt verification
  // For Apple: Send to https://buy.itunes.apple.com/verifyReceipt
  // For Google: Use Google Play Developer API
  
  // Mock verification for now
  const isValid = true;
  
  if (!isValid) {
    throw new PaymentError('Receipt verification failed');
  }
  
  // Check if already processed
  if (transaction_id) {
    const existingPurchase = await Purchase.findOne({
      where: { transaction_id }
    });
    
    if (existingPurchase) {
      return res.json({
        success: true,
        message: 'Receipt already verified',
        data: { 
          verified: true,
          purchase: existingPurchase
        }
      });
    }
  }
  
  res.json({
    success: true,
    message: 'Receipt verified successfully',
    data: {
      verified: true,
      // Include parsed receipt data
      receiptInfo: {
        valid: true,
        transactionId: transaction_id || 'mock_transaction_id'
      }
    }
  });
}));

// ====================
// GET /purchases/history
// Get purchase history
// ====================
router.get('/history', asyncHandler(async (req, res) => {
  const { limit = 20, offset = 0, type } = req.query;
  const userId = req.userId;
  
  const where = { user_id: userId };
  
  if (type) {
    where.type = type;
  }
  
  const purchases = await Purchase.findAll({
    where,
    order: [['created_at', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
  
  const total = await Purchase.count({ where });
  
  res.json({
    success: true,
    data: {
      purchases,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    }
  });
}));

// ====================
// POST /purchases/refund
// Request refund
// ====================
router.post('/refund', asyncHandler(async (req, res) => {
  const { purchase_id, reason } = req.body;
  const userId = req.userId;
  
  if (!purchase_id || !reason) {
    throw new ValidationError('purchase_id and reason are required');
  }
  
  const purchase = await Purchase.findOne({
    where: {
      id: purchase_id,
      user_id: userId
    }
  });
  
  if (!purchase) {
    throw new ValidationError('Purchase not found');
  }
  
  if (purchase.status === 'refunded') {
    throw new ValidationError('Purchase already refunded');
  }
  
  // Update purchase status
  purchase.status = 'refunded';
  purchase.refunded_at = new Date();
  purchase.refund_reason = reason;
  await purchase.save();
  
  // TODO: Process refund with store
  // TODO: Deduct coins if coin purchase
  
  logger.logUserAction(userId, 'REFUND_REQUEST', {
    purchaseId: purchase_id,
    reason
  });
  
  res.json({
    success: true,
    message: 'Refund request submitted successfully',
    data: { purchase }
  });
}));

module.exports = router;
