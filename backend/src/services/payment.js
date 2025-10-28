const axios = require('axios');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// ====================
// Apple App Store Receipt Verification
// ====================

/**
 * Verify Apple receipt
 * @param {string} receiptData - Base64 encoded receipt
 * @param {boolean} isProduction - Use production or sandbox environment
 * @returns {Promise<Object>} - Verification result
 */
const verifyAppleReceipt = async (receiptData, isProduction = true) => {
  try {
    const url = isProduction
      ? 'https://buy.itunes.apple.com/verifyReceipt'
      : 'https://sandbox.itunes.apple.com/verifyReceipt';
    
    const response = await axios.post(url, {
      'receipt-data': receiptData,
      'password': process.env.APPLE_SHARED_SECRET,
      'exclude-old-transactions': true
    });
    
    const { status, receipt, latest_receipt_info } = response.data;
    
    // Status codes: https://developer.apple.com/documentation/appstorereceipts/status
    if (status === 21007) {
      // Receipt is from sandbox, retry with sandbox URL
      return await verifyAppleReceipt(receiptData, false);
    }
    
    if (status !== 0) {
      logger.error('Apple receipt verification failed:', { status, receipt });
      return {
        valid: false,
        status,
        error: getAppleStatusMessage(status)
      };
    }
    
    // Parse receipt info
    const parsedReceipt = parseAppleReceipt(receipt, latest_receipt_info);
    
    return {
      valid: true,
      status,
      receipt: parsedReceipt,
      environment: isProduction ? 'production' : 'sandbox'
    };
  } catch (error) {
    logger.error('Error verifying Apple receipt:', error);
    throw error;
  }
};

/**
 * Parse Apple receipt data
 * @param {Object} receipt - Receipt object
 * @param {Array} latestReceiptInfo - Latest receipt info array
 * @returns {Object} - Parsed receipt
 */
const parseAppleReceipt = (receipt, latestReceiptInfo) => {
  const inAppPurchases = latestReceiptInfo || receipt.in_app || [];
  
  return {
    bundleId: receipt.bundle_id,
    applicationVersion: receipt.application_version,
    originalApplicationVersion: receipt.original_application_version,
    creationDate: receipt.receipt_creation_date_ms,
    purchases: inAppPurchases.map(purchase => ({
      productId: purchase.product_id,
      transactionId: purchase.transaction_id,
      originalTransactionId: purchase.original_transaction_id,
      purchaseDate: purchase.purchase_date_ms,
      expiresDate: purchase.expires_date_ms,
      quantity: parseInt(purchase.quantity),
      isTrialPeriod: purchase.is_trial_period === 'true',
      isInIntroOfferPeriod: purchase.is_in_intro_offer_period === 'true',
      cancellationDate: purchase.cancellation_date_ms,
      cancellationReason: purchase.cancellation_reason
    }))
  };
};

/**
 * Get Apple status message
 * @param {number} status - Status code
 * @returns {string} - Status message
 */
const getAppleStatusMessage = (status) => {
  const messages = {
    21000: 'The App Store could not read the JSON object you provided.',
    21002: 'The data in the receipt-data property was malformed or missing.',
    21003: 'The receipt could not be authenticated.',
    21004: 'The shared secret you provided does not match the shared secret on file.',
    21005: 'The receipt server is not currently available.',
    21006: 'This receipt is valid but the subscription has expired.',
    21007: 'This receipt is from the test environment.',
    21008: 'This receipt is from the production environment.',
    21009: 'Internal data access error.',
    21010: 'The user account cannot be found or has been deleted.'
  };
  
  return messages[status] || 'Unknown error';
};

// ====================
// Google Play Receipt Verification
// ====================

/**
 * Verify Google Play receipt
 * @param {string} packageName - App package name
 * @param {string} productId - Product ID
 * @param {string} purchaseToken - Purchase token
 * @returns {Promise<Object>} - Verification result
 */
const verifyGoogleReceipt = async (packageName, productId, purchaseToken) => {
  try {
    // TODO: Implement Google Play Developer API verification
    // Requires Google Service Account credentials
    
    // This is a simplified version - actual implementation requires:
    // 1. Google Service Account setup
    // 2. Using @googleapis/androidpublisher package
    // 3. Authenticating with service account
    // 4. Making API call to verify purchase
    
    logger.warn('Google Play receipt verification not fully implemented');
    
    // Mock verification for now
    return {
      valid: true,
      productId,
      purchaseToken,
      environment: 'production',
      message: 'Verification not implemented - mock success'
    };
    
    // Real implementation would look like:
    /*
    const { google } = require('googleapis');
    const androidpublisher = google.androidpublisher('v3');
    
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_PATH,
      scopes: ['https://www.googleapis.com/auth/androidpublisher']
    });
    
    const authClient = await auth.getClient();
    
    const response = await androidpublisher.purchases.products.get({
      auth: authClient,
      packageName,
      productId,
      token: purchaseToken
    });
    
    return {
      valid: response.data.purchaseState === 0,
      data: response.data
    };
    */
  } catch (error) {
    logger.error('Error verifying Google receipt:', error);
    throw error;
  }
};

/**
 * Verify Google Play subscription
 * @param {string} packageName - App package name
 * @param {string} subscriptionId - Subscription ID
 * @param {string} purchaseToken - Purchase token
 * @returns {Promise<Object>} - Verification result
 */
const verifyGoogleSubscription = async (packageName, subscriptionId, purchaseToken) => {
  try {
    // TODO: Implement Google Play subscription verification
    // Similar to product verification but uses subscriptions endpoint
    
    logger.warn('Google Play subscription verification not fully implemented');
    
    return {
      valid: true,
      subscriptionId,
      purchaseToken,
      environment: 'production',
      message: 'Verification not implemented - mock success'
    };
  } catch (error) {
    logger.error('Error verifying Google subscription:', error);
    throw error;
  }
};

// ====================
// Stripe Payment Verification (Web)
// ====================

/**
 * Verify Stripe payment
 * @param {string} paymentIntentId - Stripe Payment Intent ID
 * @returns {Promise<Object>} - Payment status
 */
const verifyStripePayment = async (paymentIntentId) => {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    return {
      valid: paymentIntent.status === 'succeeded',
      amount: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      paymentMethod: paymentIntent.payment_method,
      created: paymentIntent.created
    };
  } catch (error) {
    logger.error('Error verifying Stripe payment:', error);
    throw error;
  }
};

// ====================
// Unified Verification Function
// ====================

/**
 * Verify receipt based on platform
 * @param {string} platform - Platform (ios/android/web)
 * @param {Object} receiptData - Receipt data
 * @returns {Promise<Object>} - Verification result
 */
const verifyReceipt = async (platform, receiptData) => {
  try {
    switch (platform) {
      case 'ios':
        return await verifyAppleReceipt(receiptData.receiptData);
      
      case 'android':
        if (receiptData.subscriptionId) {
          return await verifyGoogleSubscription(
            receiptData.packageName,
            receiptData.subscriptionId,
            receiptData.purchaseToken
          );
        } else {
          return await verifyGoogleReceipt(
            receiptData.packageName,
            receiptData.productId,
            receiptData.purchaseToken
          );
        }
      
      case 'web':
        return await verifyStripePayment(receiptData.paymentIntentId);
      
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  } catch (error) {
    logger.error('Receipt verification failed:', error);
    throw error;
  }
};

// ====================
// Exports
// ====================
module.exports = {
  verifyAppleReceipt,
  verifyGoogleReceipt,
  verifyGoogleSubscription,
  verifyStripePayment,
  verifyReceipt
};
