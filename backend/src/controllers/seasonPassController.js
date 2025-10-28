const { SeasonPass, Coupon, Series, User } = require('../models');
const tranzilaService = require('../services/tranzila');
const greenInvoiceService = require('../services/greeninvoice');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Season Pass Controller
 * Handles Season Pass purchases and management
 */

/**
 * Get Season Pass pricing for a series
 */
exports.getPricing = async (req, res, next) => {
  try {
    const { seriesId } = req.params;

    const series = await Series.findByPk(seriesId);
    if (!series) {
      return res.status(404).json({
        success: false,
        message: 'Series not found',
      });
    }

    res.json({
      success: true,
      data: {
        seriesId: series.id,
        seriesTitle: series.title,
        basePrice: series.seasonPassPrice || 49.90,
        currency: 'ILS',
        freeEpisodesCount: 10,
        totalEpisodesCount: series.episodeCount || 50,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validate coupon code
 */
exports.validateCoupon = async (req, res, next) => {
  try {
    const { code, seriesId } = req.body;

    const coupon = await Coupon.findOne({
      where: {
        code: code.toUpperCase(),
        isActive: true,
      },
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'קופון לא תקין',
      });
    }

    // Check if coupon is valid for this series
    if (coupon.seriesId && coupon.seriesId !== seriesId) {
      return res.status(400).json({
        success: false,
        message: 'קופון זה אינו תקף לסדרה זו',
      });
    }

    // Check dates
    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return res.status(400).json({
        success: false,
        message: 'פג תוקף הקופון',
      });
    }

    // Check usage limit
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({
        success: false,
        message: 'הקופון הגיע למגבלת השימוש',
      });
    }

    // Calculate discount
    const series = await Series.findByPk(seriesId);
    const basePrice = series.seasonPassPrice || 49.90;
    
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (basePrice * coupon.discountValue) / 100;
    } else {
      discountAmount = coupon.discountValue;
    }

    res.json({
      success: true,
      data: {
        couponCode: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: discountAmount.toFixed(2),
        finalPrice: (basePrice - discountAmount).toFixed(2),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Season Pass order
 */
exports.createOrder = async (req, res, next) => {
  try {
    const {
      seriesId,
      customerEmail,
      customerName,
      customerPhone,
      couponCode,
    } = req.body;

    // Validate series
    const series = await Series.findByPk(seriesId);
    if (!series) {
      return res.status(404).json({
        success: false,
        message: 'Series not found',
      });
    }

    const basePrice = series.seasonPassPrice || 49.90;
    let discountAmount = 0;
    let finalPrice = basePrice;

    // Apply coupon if provided
    if (couponCode) {
      const coupon = await Coupon.findOne({
        where: { code: couponCode.toUpperCase(), isActive: true },
      });

      if (coupon) {
        if (coupon.discountType === 'percentage') {
          discountAmount = (basePrice * coupon.discountValue) / 100;
        } else {
          discountAmount = coupon.discountValue;
        }
        finalPrice = basePrice - discountAmount;
      }
    }

    // Create order ID
    const orderId = `ORD-${Date.now()}-${uuidv4().slice(0, 8)}`;

    // Create Season Pass record (pending)
    const seasonPass = await SeasonPass.create({
      userId: req.user?.id || null,
      seriesId,
      orderId,
      status: 'pending',
      price: basePrice,
      currency: 'ILS',
      discountAmount,
      finalPrice,
      couponCode: couponCode || null,
      customerEmail,
      customerName,
      customerPhone: customerPhone || null,
      paymentProvider: 'tranzila',
    });

    // Create Tranzila payment URL
    const paymentUrl = tranzilaService.createPaymentUrl(orderId, finalPrice, {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      userId: req.user?.id,
      seriesId,
    });

    res.json({
      success: true,
      data: {
        orderId,
        paymentUrl,
        amount: finalPrice,
        currency: 'ILS',
      },
    });
  } catch (error) {
    logger.error('Create order error:', error);
    next(error);
  }
};

/**
 * Tranzila Success Callback
 */
exports.tranzilaSuccess = async (req, res, next) => {
  try {
    const callbackData = req.body;
    const verification = tranzilaService.verifyCallback(callbackData);

    if (!verification.success) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
    }

    const orderId = callbackData.custom1;
    const seasonPass = await SeasonPass.findOne({ where: { orderId } });

    if (!seasonPass) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
    }

    // Update Season Pass
    await seasonPass.update({
      status: 'active',
      transactionId: verification.transactionId,
      paymentMethod: 'credit_card',
      purchasedAt: new Date(),
    });

    // Get series details for invoice
    const series = await Series.findByPk(seasonPass.seriesId);

    // Create invoice
    try {
      const invoice = await greenInvoiceService.createInvoice({
        seriesTitle: series.title,
        customerName: seasonPass.customerName,
        customerEmail: seasonPass.customerEmail,
        customerPhone: seasonPass.customerPhone,
        finalPrice: seasonPass.finalPrice,
        discountAmount: seasonPass.discountAmount,
      });

      await seasonPass.update({
        invoiceUrl: invoice.pdfUrl,
        invoiceNumber: invoice.invoiceNumber,
      });

      // Send invoice by email
      await greenInvoiceService.sendInvoiceByEmail(
        invoice.invoiceId,
        seasonPass.customerEmail
      );
    } catch (invoiceError) {
      logger.error('Invoice creation error:', invoiceError);
    }

    res.redirect(
      `${process.env.FRONTEND_URL}/payment/success?orderId=${orderId}`
    );
  } catch (error) {
    logger.error('Tranzila success callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
  }
};

/**
 * Tranzila Fail Callback
 */
exports.tranzilaFail = async (req, res, next) => {
  try {
    const callbackData = req.body;
    const orderId = callbackData.custom1;

    const seasonPass = await SeasonPass.findOne({ where: { orderId } });
    if (seasonPass) {
      await seasonPass.update({ status: 'failed' });
    }

    res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
  } catch (error) {
    logger.error('Tranzila fail callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
  }
};

/**
 * Check if user has access to series
 */
exports.checkAccess = async (req, res, next) => {
  try {
    const { seriesId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.json({
        success: true,
        data: { hasAccess: false },
      });
    }

    const seasonPass = await SeasonPass.findOne({
      where: {
        userId,
        seriesId,
        status: 'active',
      },
    });

    res.json({
      success: true,
      data: {
        hasAccess: !!seasonPass,
        purchaseDate: seasonPass?.purchasedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's Season Passes
 */
exports.getUserPasses = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const passes = await SeasonPass.findAll({
      where: { userId },
      include: [
        {
          model: Series,
          as: 'series',
          attributes: ['id', 'title', 'thumbnailUrl'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: passes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get invoice PDF
 */
exports.getInvoice = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const seasonPass = await SeasonPass.findOne({ where: { orderId } });

    if (!seasonPass) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (!seasonPass.invoiceUrl) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not available',
      });
    }

    res.json({
      success: true,
      data: {
        invoiceUrl: seasonPass.invoiceUrl,
        invoiceNumber: seasonPass.invoiceNumber,
      },
    });
  } catch (error) {
    next(error);
  }
};
