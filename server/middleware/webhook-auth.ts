import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Middleware to verify Razorpay webhook signatures
export function verifyRazorpayWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.log('Razorpay webhook secret not configured, skipping verification in development');
      return next(); // Allow in development if secret not set
    }
    
    const receivedSignature = req.headers['x-razorpay-signature'] as string;
    
    if (!receivedSignature) {
      return res.status(400).json({ error: 'Missing webhook signature' });
    }
    
    const body = JSON.stringify(req.body);
    
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');
    
    if (receivedSignature !== expectedSignature) {
      console.log('Webhook signature verification failed');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }
    
    console.log('Webhook signature verified successfully');
    next();
    
  } catch (error) {
    console.error('Webhook verification error:', error);
    res.status(500).json({ error: 'Webhook verification failed' });
  }
}

// Rate limiting for webhook endpoints - In-memory implementation for production
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function webhookRateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const rateLimitWindow = 60 * 1000; // 1 minute
  const maxRequests = 10; // Reduced for webhooks - they should be infrequent
  
  // Clean up expired entries
  const expiredKeys: string[] = [];
  rateLimitStore.forEach((value, key) => {
    if (now > value.resetTime) {
      expiredKeys.push(key);
    }
  });
  expiredKeys.forEach(key => rateLimitStore.delete(key));
  
  // Get or create rate limit data for this IP
  let limitData = rateLimitStore.get(ip);
  if (!limitData || now > limitData.resetTime) {
    limitData = { count: 0, resetTime: now + rateLimitWindow };
    rateLimitStore.set(ip, limitData);
  }
  
  // Check if limit exceeded
  if (limitData.count >= maxRequests) {
    console.warn(`Webhook rate limit exceeded for IP: ${ip}`);
    return res.status(429).json({ 
      error: 'Too many requests', 
      retryAfter: Math.ceil((limitData.resetTime - now) / 1000) 
    });
  }
  
  // Increment count and proceed
  limitData.count++;
  rateLimitStore.set(ip, limitData);
  
  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', maxRequests);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - limitData.count));
  res.setHeader('X-RateLimit-Reset', limitData.resetTime);
  
  next();
}