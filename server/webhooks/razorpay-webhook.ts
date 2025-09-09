import { Request, Response } from 'express';
import crypto from 'crypto';
import { razorpayService } from '../payment/razorpay-service';
import { sendAutomatedReceipt, ReceiptData } from '../services/receipt-generator';
import { firebaseRealtimeStorage as storage } from '../firebase-realtime-storage';

// Razorpay webhook secret - set this in your environment
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

export async function handleRazorpayWebhook(req: Request, res: Response) {
  try {
    // Verify webhook signature (skip in development/test mode)
    const receivedSignature = req.headers['x-razorpay-signature'] as string;
    
    if (WEBHOOK_SECRET && receivedSignature) {
      const body = JSON.stringify(req.body);
      
      const expectedSignature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(body)
        .digest('hex');
      
      if (receivedSignature !== expectedSignature) {
        return res.status(400).json({ error: 'Invalid signature' });
      }
    }
    
    const event = req.body;
    
    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity);
        break;
        
      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;
        
      case 'order.paid':
        await handleOrderPaid(event.payload.order.entity, event.payload.payment.entity);
        break;
        
      // Subscription webhook events
      case 'subscription.activated':
        await handleSubscriptionActivated(event.payload.subscription.entity);
        break;
        
      case 'subscription.charged':
        await handleSubscriptionCharged(event.payload.subscription.entity, event.payload.payment?.entity);
        break;
        
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event.payload.subscription.entity);
        break;
        
      case 'subscription.paused':
        await handleSubscriptionPaused(event.payload.subscription.entity);
        break;
        
      case 'subscription.resumed':
        await handleSubscriptionResumed(event.payload.subscription.entity);
        break;
        
      case 'subscription.completed':
        await handleSubscriptionCompleted(event.payload.subscription.entity);
        break;
        
      default:
        break;
    }
    
    res.status(200).json({ status: 'ok' });
    
  } catch (error) {
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handlePaymentCaptured(payment: any) {
  try {
    // Find the order associated with this payment
    const orders = await storage.getAllOrders();
    const matchingOrder = orders.find(order => 
      order.paymentMethod === 'online_payment' && 
      order.status === 'pending'
    );
    
    if (matchingOrder) {
      // Update order status
      await storage.updateOrderStatus(matchingOrder.id, 'paid');
      
      // Generate and send receipt
      await generateAndSendReceipt(payment, matchingOrder);
    }
    
  } catch (error) {
    console.error('Critical payment capture error:', error);
    // TODO: Add proper error notification system for payment failures
  }
}

async function handlePaymentFailed(payment: any) {
  try {
    // Find and update the order
    const orders = await storage.getAllOrders();
    const matchingOrder = orders.find(order => 
      order.paymentMethod === 'online_payment' && 
      order.status === 'pending'
    );
    
    if (matchingOrder) {
      await storage.updateOrderStatus(matchingOrder.id, 'payment_failed');
    }
    
  } catch (error) {
    console.error('Critical payment capture error:', error);
    // TODO: Add proper error notification system for payment failures
  }
}

async function handleOrderPaid(order: any, payment: any) {
  try {
    // This is triggered when the entire order amount is paid
    // Generate receipt for the complete order
    const orders = await storage.getAllOrders();
    const matchingOrder = orders.find(o => 
      o.paymentMethod === 'online_payment' && 
      (o.status === 'pending' || o.status === 'paid')
    );
    
    if (matchingOrder) {
      await storage.updateOrderStatus(matchingOrder.id, 'paid');
      await generateAndSendReceipt(payment, matchingOrder);
    }
    
  } catch (error) {
    console.error('Critical payment capture error:', error);
    // TODO: Add proper error notification system for payment failures
  }
}

async function generateAndSendReceipt(payment: any, order: any) {
  try {
    // Fetch build components if buildId is available
    let buildComponents: any[] = [];
    if (order.buildId) {
      try {
        buildComponents = await storage.getComponentsByBuildId(order.buildId);
      } catch (error) {
        console.error('Failed to fetch build components for receipt:', error);
      }
    }

    const receiptData: ReceiptData = {
      orderNumber: `FF${order.id.toString().padStart(8, '0')}`,
      paymentId: payment.id,
      orderId: payment.order_id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      amount: payment.amount / 100, // Convert from paisa to rupees
      paymentMethod: 'online_payment',
      paymentStatus: 'completed',
      items: [{
        build: {
          id: order.buildId || 0,
          name: order.buildName,
          category: 'custom',
          price: (payment.amount / 100).toString(),
          components: buildComponents.map(component => ({
            id: component.id,
            name: component.name,
            type: component.type,
            specification: component.specification,
            price: component.price
          }))
        },
        quantity: 1
      }],
      shippingAddress: order.shippingAddress,
      transactionDate: new Date(payment.created_at * 1000).toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata'
      }),
      companyDetails: {
        name: 'Fusion Forge PCs',
        address: process.env.BUSINESS_ADDRESS || '58,Post Office Street , Palladam , TamilNadu , India',
        phone: process.env.BUSINESS_PHONE || '+91 9363599577',
        email: process.env.BUSINESS_EMAIL || 'fusionforgepcs@gmail.com',
        website: 'www.fusionforge.com',
        gst: process.env.BUSINESS_GST || 'GST-NUMBER'
      }
    };
    
    const receiptSent = await sendAutomatedReceipt(receiptData);
    
    return receiptSent;
    
  } catch (error) {
    console.error('Critical receipt generation failure:', error);
    return false;
  }
}

// Subscription webhook handlers
async function handleSubscriptionActivated(subscription: any) {
  try {
    console.log('Subscription activated:', subscription.id);
    
    // Update subscription status in our database
    await storage.updateSubscription(subscription.id, {
      status: 'active',
      razorpaySubscriptionId: subscription.id
    });
    
  } catch (error) {
    console.error('Error handling subscription activation:', error);
  }
}

async function handleSubscriptionCharged(subscription: any, payment?: any) {
  try {
    console.log('Subscription charged:', subscription.id);
    
    if (payment) {
      // Create subscription order record
      const subscriptionOrder = {
        userId: '', // Will be updated from subscription record
        status: 'delivered' as const,
        items: JSON.stringify([{ subscriptionId: subscription.id, planName: 'Subscription Plan' }]),
        subscriptionId: subscription.id,
        orderNumber: `SUB${subscription.id.slice(-8)}`,
        amount: payment.amount / 100,
        billingPeriod: 'monthly',
        paymentId: payment.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Get subscription details to get userId
      const subscriptionRecord = await storage.getSubscriptionById(subscription.id);
      if (subscriptionRecord) {
        subscriptionOrder.userId = subscriptionRecord.userId;
        await storage.createSubscriptionOrder(subscriptionOrder);
        
        // Generate and send receipt for subscription payment
        await generateSubscriptionReceipt(payment, subscription, subscriptionRecord);
      }
    }
    
  } catch (error) {
    console.error('Error handling subscription charge:', error);
  }
}

async function handleSubscriptionCancelled(subscription: any) {
  try {
    console.log('Subscription cancelled:', subscription.id);
    
    await storage.updateSubscription(subscription.id, {
      status: 'cancelled'
    });
    
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

async function handleSubscriptionPaused(subscription: any) {
  try {
    console.log('Subscription paused:', subscription.id);
    
    await storage.updateSubscription(subscription.id, {
      status: 'paused'
    });
    
  } catch (error) {
    console.error('Error handling subscription pause:', error);
  }
}

async function handleSubscriptionResumed(subscription: any) {
  try {
    console.log('Subscription resumed:', subscription.id);
    
    await storage.updateSubscription(subscription.id, {
      status: 'active'
    });
    
  } catch (error) {
    console.error('Error handling subscription resume:', error);
  }
}

async function handleSubscriptionCompleted(subscription: any) {
  try {
    console.log('Subscription completed:', subscription.id);
    
    await storage.updateSubscription(subscription.id, {
      status: 'expired'
    });
    
  } catch (error) {
    console.error('Error handling subscription completion:', error);
  }
}

async function generateSubscriptionReceipt(payment: any, subscription: any, subscriptionRecord: any) {
  try {
    const receiptData: ReceiptData = {
      orderNumber: `SUB${subscription.id.slice(-8)}`,
      paymentId: payment.id,
      orderId: subscription.id,
      customerName: subscriptionRecord.userId,
      customerEmail: 'subscription@fusionforge.com', // Will be updated with user data
      customerPhone: 'N/A',
      amount: payment.amount / 100,
      paymentMethod: 'subscription_payment',
      paymentStatus: 'completed',
      items: [{
        build: {
          id: 0,
          name: subscriptionRecord.planName,
          category: 'subscription',
          price: (payment.amount / 100).toString(),
          components: []
        },
        quantity: 1
      }],
      shippingAddress: 'Subscription Service',
      transactionDate: new Date(payment.created_at * 1000).toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata'
      }),
      companyDetails: {
        name: 'Fusion Forge PCs',
        address: process.env.BUSINESS_ADDRESS || '58,Post Office Street , Palladam , TamilNadu , India',
        phone: process.env.BUSINESS_PHONE || '+91 9363599577',
        email: process.env.BUSINESS_EMAIL || 'fusionforgepcs@gmail.com',
        website: 'www.fusionforge.com',
        gst: process.env.BUSINESS_GST || 'GST-NUMBER'
      }
    };
    
    await sendAutomatedReceipt(receiptData);
    
  } catch (error) {
    console.error('Error generating subscription receipt:', error);
  }
}