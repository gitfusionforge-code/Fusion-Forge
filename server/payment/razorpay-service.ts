import Razorpay from 'razorpay';
import crypto from 'crypto';

interface PaymentOrder {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

interface PaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

class RazorpayService {
  private razorpay: Razorpay | null = null;

  constructor() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!keyId || !keySecret) {
      console.warn('Razorpay not configured: Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET environment variables.');
      return;
    }
    
    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  isConfigured(): boolean {
    return this.razorpay !== null;
  }

  async createOrder(orderData: PaymentOrder): Promise<any> {
    if (!this.razorpay) {
      throw new Error('Razorpay not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
    }

    try {
      const order = await this.razorpay.orders.create({
        amount: orderData.amount * 100, // Amount in paisa (smallest currency unit)
        currency: orderData.currency,
        receipt: orderData.receipt,
        notes: orderData.notes || {},
      });

      return order;
    } catch (error) {
      console.error('Razorpay order creation failed:', error);
      throw new Error('Failed to create payment order');
    }
  }

  verifyPaymentSignature(verification: PaymentVerification): boolean {
    if (!this.razorpay) {
      throw new Error('Razorpay not configured');
    }

    try {
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      
      if (!keySecret) {
        throw new Error('RAZORPAY_KEY_SECRET environment variable is not set');
      }
      
      console.log('Payment verification details:');
      console.log('Order ID:', verification.razorpay_order_id);
      console.log('Payment ID:', verification.razorpay_payment_id);
      console.log('Received Signature:', verification.razorpay_signature);
      console.log('Key Secret (first 5 chars):', keySecret.substring(0, 5) + '...');
      
      const payloadToSign = `${verification.razorpay_order_id}|${verification.razorpay_payment_id}`;
      console.log('Payload to sign:', payloadToSign);
      
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(payloadToSign)
        .digest('hex');
      
      console.log('Expected Signature:', expectedSignature);
      console.log('Signatures match:', expectedSignature === verification.razorpay_signature);

      return expectedSignature === verification.razorpay_signature;
    } catch (error) {
      console.error('Payment verification failed:', error);
      return false;
    }
  }

  async getPaymentDetails(paymentId: string): Promise<any> {
    if (!this.razorpay) {
      throw new Error('Razorpay not configured');
    }

    try {
      return await this.razorpay.payments.fetch(paymentId);
    } catch (error) {
      console.error('Failed to fetch payment details:', error);
      throw new Error('Failed to fetch payment details');
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<any> {
    if (!this.razorpay) {
      throw new Error('Razorpay not configured');
    }

    try {
      const refundData: any = {};
      if (amount) {
        refundData.amount = amount * 100; // Amount in paisa
      }

      return await this.razorpay.payments.refund(paymentId, refundData);
    } catch (error) {
      console.error('Refund failed:', error);
      throw new Error('Failed to process refund');
    }
  }
}

export const razorpayService = new RazorpayService();