const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const { asyncHandler } = require('../middleware/errorHandler');
const { ValidationError, PaymentError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// ====================
// GET /subscriptions/plans
// Get available subscription plans
// ====================
router.get('/plans', asyncHandler(async (req, res) => {
  const { platform = 'ios' } = req.query;
  
  // Define plans (these would typically come from a database)
  const plans = {
    ios: [
      {
        id: 'basic_monthly',
        name: 'Basic Monthly',
        price: 9.99,
        currency: 'USD',
        period: 'monthly',
        features: ['Ad-free viewing', 'HD quality', 'Watch on 1 device'],
        product_id: 'com.shira.subscription.basic.monthly'
      },
      {
        id: 'premium_monthly',
        name: 'Premium Monthly',
        price: 14.99,
        currency: 'USD',
        period: 'monthly',
        features: ['All Basic features', '4K quality', 'Watch on 3 devices', 'Download offline'],
        product_id: 'com.shira.subscription.premium.monthly'
      },
      {
        id: 'premium_yearly',
        name: 'Premium Yearly',
        price: 149.99,
        currency: 'USD',
        period: 'yearly',
        features: ['All Premium features', '2 months free', 'Priority support'],
        product_id: 'com.shira.subscription.premium.yearly'
      }
    ],
    android: [
      {
        id: 'basic_monthly',
        name: 'Basic Monthly',
        price: 9.99,
        currency: 'USD',
        period: 'monthly',
        features: ['Ad-free viewing', 'HD quality', 'Watch on 1 device'],
        product_id: 'basic_monthly'
      },
      {
        id: 'premium_monthly',
        name: 'Premium Monthly',
        price: 14.99,
        currency: 'USD',
        period: 'monthly',
        features: ['All Basic features', '4K quality', 'Watch on 3 devices', 'Download offline'],
        product_id: 'premium_monthly'
      },
      {
        id: 'premium_yearly',
        name: 'Premium Yearly',
        price: 149.99,
        currency: 'USD',
        period: 'yearly',
        features: ['All Premium features', '2 months free', 'Priority support'],
        product_id: 'premium_yearly'
      }
    ]
  };
  
  res.json({
    success: true,
    data: {
      plans: plans[platform] || plans.ios
    }
  });
}));

// ====================
// POST /subscriptions/subscribe
// Create new subscription
// ====================
router.post('/subscribe', asyncHandler(async (req, res) => {
  const { 
    plan_type, 
    platform, 
    transaction_id, 
    product_id, 
    receipt_data,
    billing_period = 'monthly'
  } = req.body;
  const userId = req.userId;
  
  if (!plan_type || !platform || !transaction_id) {
    throw new ValidationError('plan_type, platform, and transaction_id are required');
  }
  
  // Check if user already has active subscription
  const existingSubscription = await Subscription.getActiveSubscription(userId);
  
  if (existingSubscription) {
    throw new PaymentError('User already has an active subscription');
  }
  
  // Calculate dates
  const startDate = new Date();
  let endDate = new Date();
  
  if (billing_period === 'monthly') {
    endDate.setMonth(endDate.getMonth() + 1);
  } else if (billing_period === 'yearly') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }
  
  // TODO: Verify receipt with store (Apple/Google)
  // const isValid = await verifyReceipt(platform, receipt_data);
  // if (!isValid) throw new PaymentError('Invalid receipt');
  
  // Create subscription
  const subscription = await Subscription.create({
    user_id: userId,
    plan_type,
    platform,
    transaction_id,
    product_id,
    status: 'active',
    start_date: startDate,
    end_date: endDate,
    billing_period,
    auto_renew: true,
    receipt_data: receipt_data || {},
    price: billing_period === 'monthly' ? (plan_type === 'premium' ? 14.99 : 9.99) : 149.99,
    currency: 'USD'
  });
  
  logger.logUserAction(userId, 'SUBSCRIPTION_CREATE', {
    planType: plan_type,
    platform,
    transactionId: transaction_id
  });
  
  res.json({
    success: true,
    message: 'Subscription activated successfully',
    data: { subscription }
  });
}));

// ====================
// POST /subscriptions/cancel
// Cancel subscription
// ====================
router.post('/cancel', asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const userId = req.userId;
  
  const subscription = await Subscription.getActiveSubscription(userId);
  
  if (!subscription) {
    throw new ValidationError('No active subscription found');
  }
  
  await subscription.cancel(reason);
  
  logger.logUserAction(userId, 'SUBSCRIPTION_CANCEL', {
    subscriptionId: subscription.id,
    reason
  });
  
  res.json({
    success: true,
    message: 'Subscription cancelled. Access will continue until end of billing period.',
    data: {
      subscription,
      accessUntil: subscription.end_date
    }
  });
}));

// ====================
// POST /subscriptions/restore
// Restore purchases (iOS)
// ====================
router.post('/restore', asyncHandler(async (req, res) => {
  const { platform = 'ios', receipt_data } = req.body;
  const userId = req.userId;
  
  // TODO: Verify receipt with store and restore subscriptions
  // This is a complex process that involves:
  // 1. Verifying receipt with Apple/Google
  // 2. Finding all valid transactions
  // 3. Restoring active subscriptions
  
  const activeSubscription = await Subscription.getActiveSubscription(userId);
  
  if (activeSubscription) {
    return res.json({
      success: true,
      message: 'Active subscription found',
      data: { subscription: activeSubscription }
    });
  }
  
  res.json({
    success: true,
    message: 'No active subscriptions to restore',
    data: { subscription: null }
  });
}));

// ====================
// GET /subscriptions/history
// Get subscription history
// ====================
router.get('/history', asyncHandler(async (req, res) => {
  const { limit = 10, offset = 0 } = req.query;
  const userId = req.userId;
  
  const subscriptions = await Subscription.findAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
  
  const total = await Subscription.count({
    where: { user_id: userId }
  });
  
  res.json({
    success: true,
    data: {
      subscriptions,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    }
  });
}));

// ====================
// POST /subscriptions/webhook
// Handle store webhooks (Apple/Google)
// ====================
router.post('/webhook/:platform', asyncHandler(async (req, res) => {
  const { platform } = req.params;
  const payload = req.body;
  
  // TODO: Implement webhook handling for:
  // - Subscription renewals
  // - Subscription cancellations
  // - Refunds
  // - Billing issues
  
  logger.info(`Received ${platform} webhook:`, payload);
  
  // Process based on platform
  if (platform === 'apple') {
    // Handle Apple Server-to-Server notifications
    const notificationType = payload.notification_type;
    
    // Example: Handle renewal
    if (notificationType === 'DID_RENEW') {
      // Update subscription in database
    }
  } else if (platform === 'google') {
    // Handle Google Play Real-time Developer Notifications
    const messageData = payload.message?.data;
    
    // Decode and process
  }
  
  res.json({ success: true });
}));

module.exports = router;
