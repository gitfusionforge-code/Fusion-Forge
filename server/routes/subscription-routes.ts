import { Router } from 'express';
import { subscriptionManagementService } from '../services/subscription-management-service';
import { firebaseRealtimeStorage as storage } from '../firebase-realtime-storage';
import { insertSubscriptionSchema, insertSubscriptionOrderSchema } from '../../shared/schema';
import { z } from 'zod';

const router = Router();

// Get all subscription plans
router.get('/plans', async (req, res) => {
  try {
    const plans = subscriptionManagementService.getSubscriptionPlans();
    res.json(plans);
  } catch (error: any) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
});

// Get user's subscriptions
router.get('/user', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const subscriptions = await storage.getUserSubscriptions(userId);
    res.json(subscriptions);
  } catch (error: any) {
    console.error('Error fetching user subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Get user's subscription orders
router.get('/orders', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const orders = await storage.getUserSubscriptionOrders(userId);
    res.json(orders);
  } catch (error: any) {
    console.error('Error fetching subscription orders:', error);
    res.status(500).json({ error: 'Failed to fetch subscription orders' });
  }
});

// Create new subscription
router.post('/create', async (req, res) => {
  try {
    const { userId, planId, items } = req.body;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    if (!planId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Plan ID and items are required' });
    }

    // Get user profile for customer information
    const userProfile = await storage.getUserProfile(userId);
    if (!userProfile) {
      return res.status(400).json({ error: 'User profile not found' });
    }

    // Get user addresses for shipping
    const addresses = await storage.getUserAddresses(userId);
    const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0];
    
    if (!defaultAddress) {
      return res.status(400).json({ error: 'No shipping address found' });
    }

    const shippingAddress = `${defaultAddress.address}, ${defaultAddress.city}, ${defaultAddress.zipCode}`;

    const subscriptionRequest = {
      userId,
      planId,
      customerName: userProfile.displayName || userProfile.email,
      customerEmail: userProfile.email,
      shippingAddress,
      paymentMethod: 'Razorpay',
      items: items.map((item: any) => ({
        buildId: item.id,
        quantity: item.quantity
      }))
    };

    const subscription = await subscriptionManagementService.createSubscription(subscriptionRequest);
    res.json(subscription);
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: error.message || 'Failed to create subscription' });
  }
});

// Get subscription analytics (for admin use)
router.get('/analytics', async (req, res) => {
  try {
    // Add admin authentication check here if needed
    const analytics = await subscriptionManagementService.getSubscriptionAnalytics();
    res.json(analytics);
  } catch (error: any) {
    console.error('Error fetching subscription analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Calculate subscription pricing
router.post('/pricing', async (req, res) => {
  try {
    const { planId, items } = req.body;
    
    if (!planId || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Plan ID and items are required' });
    }

    const pricing = await subscriptionManagementService.calculateSubscriptionPricing(planId, items);
    
    if (!pricing) {
      return res.status(400).json({ error: 'Invalid plan or items' });
    }

    res.json(pricing);
  } catch (error: any) {
    console.error('Error calculating pricing:', error);
    res.status(500).json({ error: error.message || 'Failed to calculate pricing' });
  }
});

// Pause subscription
router.post('/:id/pause', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const subscriptionId = req.params.id;
    
    // Verify subscription belongs to user
    const subscription = await storage.getSubscriptionById(subscriptionId);
    if (!subscription || subscription.userId !== userId) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const updatedSubscription = await subscriptionManagementService.pauseSubscription(subscriptionId);
    res.json(updatedSubscription);
  } catch (error: any) {
    console.error('Error pausing subscription:', error);
    res.status(500).json({ error: error.message || 'Failed to pause subscription' });
  }
});

// Resume subscription
router.post('/:id/resume', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const subscriptionId = req.params.id;
    
    // Verify subscription belongs to user
    const subscription = await storage.getSubscriptionById(subscriptionId);
    if (!subscription || subscription.userId !== userId) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const updatedSubscription = await subscriptionManagementService.resumeSubscription(subscriptionId);
    res.json(updatedSubscription);
  } catch (error: any) {
    console.error('Error resuming subscription:', error);
    res.status(500).json({ error: error.message || 'Failed to resume subscription' });
  }
});

// Cancel subscription
router.post('/:id/cancel', async (req, res) => {
  try {
    const { userId, reason } = req.body;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const subscriptionId = req.params.id;
    
    // Verify subscription belongs to user
    const subscription = await storage.getSubscriptionById(subscriptionId);
    if (!subscription || subscription.userId !== userId) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const updatedSubscription = await subscriptionManagementService.cancelSubscription(subscriptionId, reason);
    res.json(updatedSubscription);
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel subscription' });
  }
});

// Get specific subscription details
router.get('/:id', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const subscriptionId = req.params.id;
    const subscription = await storage.getSubscriptionById(subscriptionId);
    
    if (!subscription || subscription.userId !== userId) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json(subscription);
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// Process subscription billing (for automated billing - internal use)
router.post('/:id/process-billing', async (req, res) => {
  try {
    // This should be protected with admin authentication or API key
    const subscriptionId = req.params.id;
    
    const result = await subscriptionManagementService.processSubscriptionBilling(subscriptionId);
    res.json(result);
  } catch (error: any) {
    console.error('Error processing subscription billing:', error);
    res.status(500).json({ error: error.message || 'Failed to process billing' });
  }
});

// Process all due subscriptions (for cron job)
router.post('/process-due', async (req, res) => {
  try {
    // This should be protected with admin authentication or API key
    const result = await subscriptionManagementService.processDueSubscriptions();
    res.json(result);
  } catch (error: any) {
    console.error('Error processing due subscriptions:', error);
    res.status(500).json({ error: 'Failed to process due subscriptions' });
  }
});

// Admin routes for subscription management
router.get('/admin/all', async (req, res) => {
  try {
    // Get all subscriptions for admin view
    const subscriptions = await storage.getAllSubscriptions();
    res.json(subscriptions);
  } catch (error: any) {
    console.error('Error fetching all subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Admin route to get subscription by ID
router.get('/admin/:id', async (req, res) => {
  try {
    const subscriptionId = req.params.id;
    const subscription = await storage.getSubscriptionById(subscriptionId);
    
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    
    res.json(subscription);
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// Admin route to update subscription status
router.post('/admin/:id/:action', async (req, res) => {
  try {
    const subscriptionId = req.params.id;
    const action = req.params.action; // 'pause', 'resume', 'cancel'
    const { reason } = req.body;
    
    const subscription = await storage.getSubscriptionById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    
    let updatedSubscription;
    
    switch (action) {
      case 'pause':
        updatedSubscription = await subscriptionManagementService.pauseSubscription(subscriptionId);
        break;
      case 'resume':
        updatedSubscription = await subscriptionManagementService.resumeSubscription(subscriptionId);
        break;
      case 'cancel':
        updatedSubscription = await subscriptionManagementService.cancelSubscription(subscriptionId, reason);
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
    
    res.json(updatedSubscription);
  } catch (error: any) {
    console.error(`Error ${req.params.action} subscription:`, error);
    res.status(500).json({ error: `Failed to ${req.params.action} subscription` });
  }
});

export { router as subscriptionRoutes };