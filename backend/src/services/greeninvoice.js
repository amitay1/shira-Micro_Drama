const axios = require('axios');
const logger = require('../utils/logger');

/**
 * GreenInvoice Service
 * Israeli invoice automation service
 */
class GreenInvoiceService {
  constructor() {
    this.apiKey = process.env.GREENINVOICE_API_KEY;
    this.apiSecret = process.env.GREENINVOICE_API_SECRET;
    this.baseUrl = process.env.GREENINVOICE_BASE_URL || 'https://api.greeninvoice.co.il';
    this.businessId = process.env.GREENINVOICE_BUSINESS_ID;
  }

  /**
   * Get authentication token
   */
  async getAuthToken() {
    try {
      const response = await axios.post(`${this.baseUrl}/api/v1/account/token`, {
        id: this.apiKey,
        secret: this.apiSecret,
      });

      return response.data.token;
    } catch (error) {
      logger.error('GreenInvoice auth error:', error);
      throw new Error('Failed to authenticate with GreenInvoice');
    }
  }

  /**
   * Create invoice/receipt
   */
  async createInvoice(orderData) {
    try {
      const token = await this.getAuthToken();

      const invoicePayload = {
        description: `Season Pass - ${orderData.seriesTitle}`,
        type: 320, // Receipt (קבלה)
        lang: 'he',
        currency: 'ILS',
        vatType: 0, // No VAT
        date: new Date().toISOString().split('T')[0],
        client: {
          name: orderData.customerName,
          emails: [orderData.customerEmail],
          phone: orderData.customerPhone || '',
          address: '',
          city: '',
        },
        income: [
          {
            description: `גישה מלאה לסדרה: ${orderData.seriesTitle}`,
            quantity: 1,
            price: orderData.finalPrice,
            currency: 'ILS',
            vatType: 0,
          },
        ],
        payment: [
          {
            type: 'credit',
            price: orderData.finalPrice,
            currency: 'ILS',
            date: new Date().toISOString().split('T')[0],
          },
        ],
      };

      // Add discount if exists
      if (orderData.discountAmount > 0) {
        invoicePayload.income[0].description += ` (הנחה: ${orderData.discountAmount}₪)`;
      }

      const response = await axios.post(
        `${this.baseUrl}/api/v1/documents`,
        invoicePayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        invoiceId: response.data.id,
        invoiceNumber: response.data.number,
        invoiceUrl: response.data.url,
        pdfUrl: response.data.pdf,
      };
    } catch (error) {
      logger.error('GreenInvoice creation error:', error);
      throw new Error('Failed to create invoice');
    }
  }

  /**
   * Send invoice via email
   */
  async sendInvoiceByEmail(invoiceId, email) {
    try {
      const token = await this.getAuthToken();

      await axios.post(
        `${this.baseUrl}/api/v1/documents/${invoiceId}/send`,
        { email },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return { success: true };
    } catch (error) {
      logger.error('GreenInvoice send email error:', error);
      throw new Error('Failed to send invoice');
    }
  }

  /**
   * Get invoice details
   */
  async getInvoice(invoiceId) {
    try {
      const token = await this.getAuthToken();

      const response = await axios.get(
        `${this.baseUrl}/api/v1/documents/${invoiceId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error('GreenInvoice get invoice error:', error);
      throw new Error('Failed to get invoice');
    }
  }

  /**
   * Cancel/Refund invoice
   */
  async cancelInvoice(invoiceId) {
    try {
      const token = await this.getAuthToken();

      await axios.post(
        `${this.baseUrl}/api/v1/documents/${invoiceId}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return { success: true };
    } catch (error) {
      logger.error('GreenInvoice cancel error:', error);
      throw new Error('Failed to cancel invoice');
    }
  }
}

module.exports = new GreenInvoiceService();
