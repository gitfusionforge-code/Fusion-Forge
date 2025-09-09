import { firebaseRealtimeStorage as storage } from '../firebase-realtime-storage';
import { razorpayService } from '../payment/razorpay-service';
import { sendEmail } from '../email-service';
import type { 
  Subscription, 
  InsertSubscription, 
  SubscriptionOrder, 
  InsertSubscriptionOrder,
  PcBuild 
} from '../../shared/schema';

interface SubscriptionPlan {
  id: string;
  name: string;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  discountPercentage: number;
  description: string;
  minimumItems: number;
  features: string[];
}

interface CreateSubscriptionRequest {
  userId: string;
  planId: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  paymentMethod: string;
  items: Array<{
    buildId: number;
    quantity: number;
  }>;
}

interface SubscriptionAnalytics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  monthlyRecurringRevenue: number;
  averageOrderValue: number;
  churnRate: number;
  subscriptionsByPlan: Record<string, number>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    subscriptions: number;
  }>;
}

class SubscriptionManagementService {
  private subscriptionPlans: Map<string, SubscriptionPlan> = new Map();

  constructor() {
    this.initializeSubscriptionPlans();
  }

  // Initialize default subscription plans
  private initializeSubscriptionPlans() {
    const plans: SubscriptionPlan[] = [
      {
        id: 'monthly_standard',
        name: 'Monthly Standard',
        billingCycle: 'monthly',
        discountPercentage: 0,
        description: 'Monthly delivery with standard pricing',
        minimumItems: 1,
        features: [
          'Monthly PC delivery',
          'Standard customer support',
          'Flexible cancellation',
          'Component upgrades available'
        ]
      },
      {
        id: 'monthly_premium',
        name: 'Monthly Premium',
        billingCycle: 'monthly',
        discountPercentage: 5,
        description: 'Monthly delivery with 5% discount',
        minimumItems: 2,
        features: [
          'Monthly PC delivery',
          'Priority customer support',
          '5% discount on all orders',
          'Free component upgrades',
          'Express shipping included'
        ]
      },
      {
        id: 'quarterly_business',
        name: 'Quarterly Business',
        billingCycle: 'quarterly',
        discountPercentage: 10,
        description: 'Quarterly delivery for businesses with 10% discount',
        minimumItems: 3,
        features: [
          'Quarterly PC delivery',
          'Dedicated account manager',
          '10% discount on all orders',
          'Bulk pricing advantages',
          'Custom configuration support',
          'Extended warranty included'
        ]
      },
      {
        id: 'yearly_enterprise',
        name: 'Yearly Enterprise',
        billingCycle: 'yearly',
        discountPercentage: 15,
        description: 'Annual delivery for enterprises with maximum savings',
        minimumItems: 5,
        features: [
          'Annual PC delivery',
          '24/7 enterprise support',
          '15% discount on all orders',
          'Custom hardware sourcing',
          'White-glove deployment service',
          'Multi-year warranty',
          'Volume licensing included'
        ]
      }
    ];

    plans.forEach(plan => {
      this.subscriptionPlans.set(plan.id, plan);
    });
  }

  // Get all available subscription plans
  getSubscriptionPlans(): SubscriptionPlan[] {
    return Array.from(this.subscriptionPlans.values());
  }

  // Get specific subscription plan
  getSubscriptionPlan(planId: string): SubscriptionPlan | undefined {
    return this.subscriptionPlans.get(planId);
  }

  // Calculate subscription pricing with discounts
  async calculateSubscriptionPricing(
    planId: string, 
    items: Array<{ buildId: number; quantity: number }>
  ): Promise<{
    basePrice: number;
    discountAmount: number;
    finalPrice: number;
    discountPercentage: number;
    itemBreakdown: Array<{
      buildId: number;
      buildName: string;
      unitPrice: number;
      quantity: number;
      totalPrice: number;
    }>;
  } | null> {
    const plan = this.subscriptionPlans.get(planId);
    if (!plan) return null;

    // Validate minimum items requirement
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    if (totalQuantity < plan.minimumItems) {
      throw new Error(`Plan requires minimum ${plan.minimumItems} items`);
    }

    let basePrice = 0;
    const itemBreakdown = [];

    // Calculate base price for all items
    for (const item of items) {
      const build = await storage.getPcBuildById(item.buildId);
      if (!build) {
        throw new Error(`Build with ID ${item.buildId} not found`);
      }

      const itemTotalPrice = build.totalPrice * item.quantity;
      basePrice += itemTotalPrice;

      itemBreakdown.push({
        buildId: item.buildId,
        buildName: build.name,
        unitPrice: build.totalPrice,
        quantity: item.quantity,
        totalPrice: itemTotalPrice
      });
    }

    // Apply subscription discount
    const discountAmount = basePrice * (plan.discountPercentage / 100);
    const finalPrice = basePrice - discountAmount;

    return {
      basePrice,
      discountAmount,
      finalPrice,
      discountPercentage: plan.discountPercentage,
      itemBreakdown
    };
  }

  // Create new subscription
  async createSubscription(request: CreateSubscriptionRequest): Promise<Subscription> {
    const plan = this.subscriptionPlans.get(request.planId);
    if (!plan) {
      throw new Error('Invalid subscription plan');
    }

    // Calculate pricing
    const pricing = await this.calculateSubscriptionPricing(request.planId, request.items);
    if (!pricing) {
      throw new Error('Unable to calculate subscription pricing');
    }

    // Prepare subscription items
    const subscriptionItems = pricing.itemBreakdown.map(item => ({
      buildId: item.buildId,
      buildName: item.buildName,
      category: '', // Will be populated from build data
      quantity: item.quantity,
      unitPrice: item.unitPrice
    }));

    // Populate category information
    for (const item of subscriptionItems) {
      const build = await storage.getPcBuildById(item.buildId);
      if (build) {
        item.category = build.category;
      }
    }

    const subscriptionData: InsertSubscription = {
      userId: request.userId,
      planId: request.planId,
      planName: plan.name,
      status: 'pending',
      billingCycle: plan.billingCycle,
      basePrice: pricing.basePrice,
      discountPercentage: pricing.discountPercentage,
      finalPrice: pricing.finalPrice,
      items: subscriptionItems,
      customerEmail: request.customerEmail,
      customerName: request.customerName,
      shippingAddress: request.shippingAddress,
      paymentMethod: request.paymentMethod
    };

    const subscription = await storage.createSubscription(subscriptionData);

    // Send confirmation email
    await this.sendSubscriptionConfirmationEmail(subscription);

    return subscription;
  }

  // Process subscription billing
  async processSubscriptionBilling(subscriptionId: string): Promise<{
    success: boolean;
    orderId?: string;
    paymentId?: string;
    error?: string;
  }> {
    try {
      const subscription = await storage.getSubscriptionById(subscriptionId);
      if (!subscription) {
        return { success: false, error: 'Subscription not found' };
      }

      if (subscription.status !== 'active') {
        return { success: false, error: 'Subscription is not active' };
      }

      // Create Razorpay order for billing
      const orderData = {
        amount: subscription.finalPrice,
        currency: 'INR',
        receipt: `sub_billing_${subscriptionId}_${Date.now()}`,
        notes: {
          subscriptionId: subscriptionId,
          billingCycle: subscription.billingCycle,
          customerEmail: subscription.customerEmail
        }
      };

      const razorpayOrder = await razorpayService.createOrder(orderData);

      // Create subscription order record
      const subscriptionOrder: InsertSubscriptionOrder = {
        subscriptionId: subscriptionId,
        userId: subscription.userId,
        orderNumber: `SUB${Date.now()}`,
        status: 'pending',
        amount: subscription.finalPrice,
        items: JSON.stringify(subscription.items),
        billingPeriod: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
      };

      const order = await storage.createSubscriptionOrder(subscriptionOrder);

      // Update subscription billing information
      const nextBillingDate = this.calculateNextBillingDate(subscription.billingCycle);
      // Note: Update subscription next billing date via status change
      await storage.updateSubscriptionStatus(subscriptionId, 'active');

      return {
        success: true,
        orderId: order.id,
        paymentId: razorpayOrder.id
      };

    } catch (error: any) {
      console.error('Subscription billing failed:', error);
      
      // Handle failed payment - cancel subscription after multiple failures
      const subscription = await storage.getSubscriptionById(subscriptionId);
      if (subscription && subscription.failedPayments >= 2) {
        await this.cancelSubscription(subscriptionId, 'Too many failed payments');
      }

      return { 
        success: false, 
        error: error.message || 'Billing processing failed' 
      };
    }
  }

  // Calculate next billing date based on cycle
  private calculateNextBillingDate(billingCycle: 'monthly' | 'quarterly' | 'yearly'): Date {
    const now = new Date();
    
    switch (billingCycle) {
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      case 'quarterly':
        return new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
      case 'yearly':
        return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      default:
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string, reason?: string): Promise<Subscription> {
    const subscription = await storage.cancelSubscription(subscriptionId, reason);
    
    // Send cancellation confirmation email
    await this.sendSubscriptionCancellationEmail(subscription);
    
    return subscription;
  }

  // Pause subscription
  async pauseSubscription(subscriptionId: string): Promise<Subscription> {
    const subscription = await storage.pauseSubscription(subscriptionId);
    
    // Send pause confirmation email
    await this.sendSubscriptionUpdateEmail(subscription, 'paused');
    
    return subscription;
  }

  // Resume subscription
  async resumeSubscription(subscriptionId: string): Promise<Subscription> {
    const subscription = await storage.resumeSubscription(subscriptionId);
    
    // Send resume confirmation email
    await this.sendSubscriptionUpdateEmail(subscription, 'resumed');
    
    return subscription;
  }

  // Get subscriptions due for billing
  async getSubscriptionsDueForBilling(date?: Date): Promise<Subscription[]> {
    return await storage.getSubscriptionsDueBilling(date);
  }

  // Process all due subscriptions (for automated billing)
  async processDueSubscriptions(): Promise<{
    processed: number;
    successful: number;
    failed: number;
    errors: Array<{ subscriptionId: string; error: string }>;
  }> {
    const dueSubscriptions = await this.getSubscriptionsDueForBilling();
    
    let successful = 0;
    let failed = 0;
    const errors: Array<{ subscriptionId: string; error: string }> = [];

    for (const subscription of dueSubscriptions) {
      try {
        const result = await this.processSubscriptionBilling(subscription.id);
        
        if (result.success) {
          successful++;
        } else {
          failed++;
          errors.push({
            subscriptionId: subscription.id,
            error: result.error || 'Unknown error'
          });
        }
      } catch (error: any) {
        failed++;
        errors.push({
          subscriptionId: subscription.id,
          error: error.message || 'Processing failed'
        });
      }
    }

    return {
      processed: dueSubscriptions.length,
      successful,
      failed,
      errors
    };
  }

  // Get subscription analytics
  async getSubscriptionAnalytics(): Promise<SubscriptionAnalytics> {
    const allSubscriptions = await storage.getAllSubscriptions();
    const activeSubscriptions = allSubscriptions.filter(sub => sub.status === 'active');
    
    // Calculate monthly recurring revenue
    const monthlyRevenue = activeSubscriptions.reduce((total, sub) => {
      let monthlyValue = sub.finalPrice;
      
      switch (sub.billingCycle) {
        case 'quarterly':
          monthlyValue = sub.finalPrice / 3;
          break;
        case 'yearly':
          monthlyValue = sub.finalPrice / 12;
          break;
      }
      
      return total + monthlyValue;
    }, 0);

    // Calculate average order value
    const totalRevenue = allSubscriptions.reduce((total, sub) => total + sub.finalPrice, 0);
    const averageOrderValue = allSubscriptions.length > 0 ? totalRevenue / allSubscriptions.length : 0;

    // Calculate churn rate (simplified)
    const cancelledSubscriptions = allSubscriptions.filter(sub => sub.status === 'cancelled');
    const churnRate = allSubscriptions.length > 0 ? 
      (cancelledSubscriptions.length / allSubscriptions.length) * 100 : 0;

    // Subscriptions by plan
    const subscriptionsByPlan: Record<string, number> = {};
    allSubscriptions.forEach(sub => {
      subscriptionsByPlan[sub.planName] = (subscriptionsByPlan[sub.planName] || 0) + 1;
    });

    // Revenue by month (last 6 months)
    const revenueByMonth = this.calculateRevenueByMonth(allSubscriptions);

    return {
      totalSubscriptions: allSubscriptions.length,
      activeSubscriptions: activeSubscriptions.length,
      monthlyRecurringRevenue: monthlyRevenue,
      averageOrderValue,
      churnRate,
      subscriptionsByPlan,
      revenueByMonth
    };
  }

  // Calculate revenue by month for the last 6 months
  private calculateRevenueByMonth(subscriptions: Subscription[]): Array<{
    month: string;
    revenue: number;
    subscriptions: number;
  }> {
    const monthlyData: Record<string, { revenue: number; count: number }> = {};
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = { revenue: 0, count: 0 };
    }

    // Calculate revenue for each month
    subscriptions.forEach(sub => {
      const createdDate = new Date(sub.createdAt);
      const monthKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].revenue += sub.finalPrice;
        monthlyData[monthKey].count += 1;
      }
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      subscriptions: data.count
    }));
  }

  // Email notification methods
  private async sendSubscriptionConfirmationEmail(subscription: Subscription): Promise<void> {
    const emailData = {
      to: subscription.customerEmail,
      from: process.env.BUSINESS_EMAIL || 'noreply@fusionforgepc.com',
      subject: `🎉 Subscription Confirmed - ${subscription.planName}`,
      html: this.generateSubscriptionEmailHTML(subscription, 'confirmation'),
      text: `Your subscription to ${subscription.planName} has been confirmed. Next billing date: ${new Date(subscription.nextBillingDate).toLocaleDateString()}`
    };

    try {
      await sendEmail(emailData);
      console.log(`Subscription confirmation email sent to: ${subscription.customerEmail}`);
    } catch (error) {
      console.error('Failed to send subscription confirmation email:', error);
    }
  }

  private async sendSubscriptionCancellationEmail(subscription: Subscription): Promise<void> {
    const emailData = {
      to: subscription.customerEmail,
      from: process.env.BUSINESS_EMAIL || 'noreply@fusionforgepc.com',
      subject: `Subscription Cancelled - ${subscription.planName}`,
      html: this.generateSubscriptionEmailHTML(subscription, 'cancellation'),
      text: `Your subscription to ${subscription.planName} has been cancelled. Reason: ${subscription.cancellationReason || 'User requested'}`
    };

    try {
      await sendEmail(emailData);
      console.log(`Subscription cancellation email sent to: ${subscription.customerEmail}`);
    } catch (error) {
      console.error('Failed to send subscription cancellation email:', error);
    }
  }

  private async sendSubscriptionUpdateEmail(subscription: Subscription, action: 'paused' | 'resumed'): Promise<void> {
    const emailData = {
      to: subscription.customerEmail,
      from: process.env.BUSINESS_EMAIL || 'noreply@fusionforgepc.com',
      subject: `Subscription ${action === 'paused' ? 'Paused' : 'Resumed'} - ${subscription.planName}`,
      html: this.generateSubscriptionEmailHTML(subscription, action),
      text: `Your subscription to ${subscription.planName} has been ${action}.`
    };

    try {
      await sendEmail(emailData);
      console.log(`Subscription ${action} email sent to: ${subscription.customerEmail}`);
    } catch (error) {
      console.error(`Failed to send subscription ${action} email:`, error);
    }
  }

  private generateSubscriptionEmailHTML(subscription: Subscription, type: 'confirmation' | 'cancellation' | 'paused' | 'resumed'): string {
    const headerText = {
      confirmation: '🎉 Subscription Confirmed!',
      cancellation: '❌ Subscription Cancelled',
      paused: '⏸️ Subscription Paused',
      resumed: '▶️ Subscription Resumed'
    }[type];

    const itemsHTML = subscription.items.map(item => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px 0; color: #374151;">${item.buildName}</td>
        <td style="padding: 10px 0; text-align: center; color: #6b7280;">${item.quantity}</td>
        <td style="padding: 10px 0; text-align: right; color: #374151;">₹${item.unitPrice.toLocaleString('en-IN')}</td>
      </tr>
    `).join('');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1e3a8a; margin: 0; font-size: 32px; font-weight: bold;">FusionForge PCs</h1>
          <p style="color: #64748b; margin: 5px 0; font-size: 16px;">Forge Your Power</p>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #1e3a8a; margin-top: 0;">${headerText}</h2>
          <p><strong>Plan:</strong> ${subscription.planName}</p>
          <p><strong>Billing Cycle:</strong> ${subscription.billingCycle}</p>
          <p><strong>Amount:</strong> ₹${subscription.finalPrice.toLocaleString('en-IN')}</p>
          ${type === 'confirmation' ? `<p><strong>Next Billing:</strong> ${new Date(subscription.nextBillingDate).toLocaleDateString()}</p>` : ''}
        </div>

        <div style="background: #fff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #1e3a8a; margin-top: 0;">Items in Subscription</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid #e5e7eb;">
                <th style="text-align: left; padding: 10px 0; color: #374151;">Item</th>
                <th style="text-align: center; padding: 10px 0; color: #374151;">Quantity</th>
                <th style="text-align: right; padding: 10px 0; color: #374151;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>
        </div>

        <div style="text-align: center; color: #64748b; font-size: 14px;">
          <p>Thank you for choosing FusionForge PCs!</p>
          <p>For support, contact us at ${process.env.BUSINESS_EMAIL || 'support@fusionforgepc.com'}</p>
        </div>
      </div>
    `;
  }
}

export const subscriptionManagementService = new SubscriptionManagementService();