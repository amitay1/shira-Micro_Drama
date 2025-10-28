const express = require('express');
const router = express.Router();
const seasonPassController = require('../controllers/seasonPassController');
const authMiddleware = require('../middleware/auth');
const { body, param } = require('express-validator');

/**
 * Season Pass Routes
 */

// Public routes
router.get(
  '/pricing/:seriesId',
  param('seriesId').isUUID(),
  seasonPassController.getPricing
);

router.post(
  '/validate-coupon',
  [
    body('code').isString().trim().notEmpty(),
    body('seriesId').isUUID(),
  ],
  seasonPassController.validateCoupon
);

router.post(
  '/create-order',
  [
    body('seriesId').isUUID(),
    body('customerEmail').isEmail(),
    body('customerName').isString().trim().notEmpty(),
    body('customerPhone').optional().isString(),
    body('couponCode').optional().isString(),
  ],
  seasonPassController.createOrder
);

// Tranzila callbacks
router.post('/tranzila/success', seasonPassController.tranzilaSuccess);
router.post('/tranzila/fail', seasonPassController.tranzilaFail);

// Protected routes
router.get(
  '/check-access/:seriesId',
  authMiddleware,
  param('seriesId').isUUID(),
  seasonPassController.checkAccess
);

router.get(
  '/my-passes',
  authMiddleware,
  seasonPassController.getUserPasses
);

router.get(
  '/invoice/:orderId',
  param('orderId').isString(),
  seasonPassController.getInvoice
);

module.exports = router;
