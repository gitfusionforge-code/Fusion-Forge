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
      throw new Error('Razorpay not configured: Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET environment variables. Payment processing will not work.');
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

  // Subscription methods for recurring payments
  async createSubscription(subscriptionData: {
    planId: string;
    customerId?: string;
    totalCount?: number;
    startAt?: number;
    notes?: Record<string, string>;
  }): Promise<any> {
    if (!this.razorpay) {
      throw new Error('Razorpay not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
    }

    try {
      const subscription = await this.razorpay.subscriptions.create({
        plan_id: subscriptionData.planId,
        customer_id: subscriptionData.customerId,
        total_count: subscriptionData.totalCount,
        start_at: subscriptionData.startAt,
        notes: subscriptionData.notes || {},
      });

      return subscription;
    } catch (error) {
      console.error('Razorpay subscription creation failed:', error);
      throw new Error('Failed to create subscription');
    }
  }

  async createPlan(planData: {
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    amount: number;
    currency: string;
    notes?: Record<string, string>;
  }): Promise<any> {
    if (!this.razorpay) {
      throw new Error('Razorpay not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
    }

    try {
      const plan = await this.razorpay.plans.create({
        period: planData.period,
        interval: planData.interval,
        item: {
          name: `Subscription Plan - ${planData.period}`,
          amount: planData.amount * 100, // Amount in paisa
          currency: planData.currency,
          description: `Recurring ${planData.period} subscription plan`,
        },
        notes: planData.notes || {},
      });

      return plan;
    } catch (error) {
      console.error('Razorpay plan creation failed:', error);
      throw new Error('Failed to create subscription plan');
    }
  }

  async getSubscription(subscriptionId: string): Promise<any> {
    if (!this.razorpay) {
      throw new Error('Razorpay not configured');
    }

    try {
      return await this.razorpay.subscriptions.fetch(subscriptionId);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      throw new Error('Failed to fetch subscription details');
    }
  }

  async cancelSubscription(subscriptionId: string, cancelAtCycleEnd: boolean = false): Promise<any> {
    if (!this.razorpay) {
      throw new Error('Razorpay not configured');
    }

    try {
      return await this.razorpay.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  async pauseSubscription(subscriptionId: string): Promise<any> {
    if (!this.razorpay) {
      throw new Error('Razorpay not configured');
    }

    try {
      return await this.razorpay.subscriptions.pause(subscriptionId, {
        pause_at: 'now',
      });
    } catch (error) {
      console.error('Failed to pause subscription:', error);
      throw new Error('Failed to pause subscription');
    }
  }

  async resumeSubscription(subscriptionId: string): Promise<any> {
    if (!this.razorpay) {
      throw new Error('Razorpay not configured');
    }

    try {
      return await this.razorpay.subscriptions.resume(subscriptionId, {
        resume_at: 'now',
      });
    } catch (error) {
      console.error('Failed to resume subscription:', error);
      throw new Error('Failed to resume subscription');
    }
  }
}

export const razorpayService = new RazorpayService();