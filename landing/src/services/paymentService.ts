import { apiClient } from '@/lib/api-client';
import type { CheckoutFormData } from '@/types';

class PaymentService {
  private useBackend = false;

  async createOrder(data: CheckoutFormData & { seriesId: string }) {
    if (this.useBackend) {
      try {
        const response = await apiClient.createPayment({
          seriesId: data.seriesId,
          email: data.email,
          name: data.name,
          phone: data.phone,
          couponCode: data.couponCode,
        });
        return response;
      } catch (error: any) {
        throw new Error(error.message || 'Payment failed');
      }
    }

    // Mock payment for testing
    return {
      success: true,
      data: {
        orderId: `mock-${Date.now()}`,
        transactionId: `tx-${Date.now()}`,
        amount: 99,
        currency: 'ILS',
        invoiceUrl: '#',
      },
    };
  }

  async validateCoupon(code: string, seriesId: string) {
    if (this.useBackend) {
      try {
        const response = await apiClient.validateCoupon(code, seriesId);
        return response;
      } catch (error: any) {
        throw new Error(error.message || 'Invalid coupon');
      }
    }

    // Mock coupon validation
    const validCoupons: Record<string, { discount: number; type: 'percentage' | 'fixed' }> = {
      'DEMO10': { discount: 10, type: 'fixed' },
      'WELCOME20': { discount: 20, type: 'percentage' },
      'FIRST50': { discount: 50, type: 'percentage' },
    };

    const coupon = validCoupons[code.toUpperCase()];
    if (!coupon) {
      throw new Error('קוד קופון לא תקין');
    }

    return {
      success: true,
      data: {
        code: code.toUpperCase(),
        discountType: coupon.type,
        discountValue: coupon.discount,
        valid: true,
      },
    };
  }

  async getInvoice(orderId: string) {
    if (this.useBackend) {
      return await apiClient.getInvoice(orderId);
    }
    return null;
  }

  enableBackend() {
    this.useBackend = true;
  }

  disableBackend() {
    this.useBackend = false;
  }
}

export const paymentService = new PaymentService();
export default paymentService;
