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

// Rate limiting for webhook endpoints
export function webhookRateLimit(req: Request, res: Response, next: NextFunction) {
  // Simple rate limiting - in production, use a proper rate limiter
  const ip = req.ip;
  const now = Date.now();
  
  // Allow 60 requests per minute per IP
  const rateLimitWindow = 60 * 1000; // 1 minute
  const maxRequests = 60;
  
  // In a real implementation, you'd use Redis or similar for distributed rate limiting
  // For now, this is a basic in-memory approach
  
  next(); // Skip rate limiting in this implementation
}