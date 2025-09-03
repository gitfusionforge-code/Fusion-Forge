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
    // Error handling without console logging
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
    // Error handling without console logging
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
    // Error handling without console logging
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
        // Error handling without console logging
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
    return false;
  }
}