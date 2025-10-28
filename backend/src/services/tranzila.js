const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Tranzila Payment Service
 * Integration with Israeli PSP - Tranzila
 */
class TranzilaService {
  constructor() {
    this.terminalName = process.env.TRANZILA_TERMINAL_NAME;
    this.terminalPassword = process.env.TRANZILA_TERMINAL_PASSWORD;
    this.baseUrl = process.env.TRANZILA_BASE_URL || 'https://direct.tranzila.com';
    this.currency = 1; // 1 = ILS
  }

  /**
   * Create payment iframe URL
   */
  createPaymentUrl(orderId, amount, customerDetails) {
    const params = new URLSearchParams({
      supplier: this.terminalName,
      sum: amount.toFixed(2),
      currency: this.currency,
      cred_type: 1, // Regular credit
      tranmode: 'VK', // Verify + Capture
      // Order details
      pdesc: `Season Pass - Order #${orderId}`,
      contact: customerDetails.name,
      email: customerDetails.email,
      phone: customerDetails.phone || '',
      // Return URLs
      success_url_address: `${process.env.APP_URL}/api/v1/payments/tranzila/success`,
      fail_url_address: `${process.env.APP_URL}/api/v1/payments/tranzila/fail`,
      notify_url_address: `${process.env.APP_URL}/api/v1/payments/tranzila/webhook`,
      // Custom fields
      custom1: orderId,
      custom2: customerDetails.userId || '',
      custom3: customerDetails.seriesId || '',
    });

    return `${this.baseUrl}/${this.terminalName}?${params.toString()}`;
  }

  /**
   * Process direct payment (for Apple Pay / Google Pay)
   */
  async processDirectPayment(paymentData) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.terminalName}`,
        {          sum: paymentData.amount,
          currency: this.currency,
          ccno: paymentData.cardNumber,
          expdate: paymentData.expiry, // MMYY format
          cvv: paymentData.cvv,
          myid: paymentData.idNumber,
          cred_type: 1,
          tranmode: 'VK',
          supplier: this.terminalName,
          TranzilaPW: this.terminalPassword,
          // Order details
          pdesc: paymentData.description,
          contact: paymentData.customerName,
          email: paymentData.customerEmail,
          phone: paymentData.customerPhone || '',
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return this.parseResponse(response.data);
    } catch (error) {
      logger.error('Tranzila direct payment error:', error);
      throw new Error('Payment processing failed');
    }
  }

  /**
   * Verify payment callback
   */
  verifyCallback(callbackData) {
    // Tranzila sends response code
    // 000 = Success
    // Other codes = various errors
    
    return {
      success: callbackData.Response === '000',
      transactionId: callbackData.index,
      authNumber: callbackData.ConfirmationCode,
      responseCode: callbackData.Response,
      errorMessage: this.getErrorMessage(callbackData.Response),
      rawData: callbackData,
    };
  }

  /**
   * Parse Tranzila response
   */
  parseResponse(data) {
    const isSuccess = data.Response === '000';
    
    return {
      success: isSuccess,
      transactionId: data.index,
      authNumber: data.ConfirmationCode,
      responseCode: data.Response,
      errorMessage: isSuccess ? null : this.getErrorMessage(data.Response),
      rawData: data,
    };
  }

  /**
   * Get error message by response code
   */
  getErrorMessage(code) {
    const errorMessages = {
      '000': 'Success',
      '001': 'Card blocked',
      '002': 'Card stolen',
      '003': 'Contact credit company',
      '004': 'Refusal',
      '005': 'Forged card',
      '006': 'ID and CVV required',
      '033': 'Card expired',
      '036': 'Card blocked',
      '039': 'No such credit card',
      '122': 'CVV does not match',
      '999': 'System error',
    };

    return errorMessages[code] || `Error code: ${code}`;
  }

  /**
   * Refund transaction
   */
  async refundTransaction(transactionId, amount) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.terminalName}`,
        {
          supplier: this.terminalName,
          TranzilaPW: this.terminalPassword,
          tranmode: 'CRD', // Credit/Refund
          index: transactionId,
          sum: amount.toFixed(2),
          currency: this.currency,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return this.parseResponse(response.data);
    } catch (error) {
      logger.error('Tranzila refund error:', error);
      throw new Error('Refund processing failed');
    }
  }
}

module.exports = new TranzilaService();
