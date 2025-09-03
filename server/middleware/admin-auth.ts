import { Request, Response, NextFunction } from "express";

// Admin configuration validation
const adminEmail = process.env.ADMIN_EMAIL;

if (!adminEmail) {
  throw new Error('Missing required admin email. Please set ADMIN_EMAIL environment variable.');
}

// Type-safe admin configuration after validation
const ADMIN_EMAIL: string = adminEmail;

// ⚠️ WARNING: In-memory session store - sessions will be lost on server restart
// For production, use Redis, database, or persistent storage
// This is a known bug that needs to be fixed for production use
const adminSessions = new Set<string>();
const adminEmails = new Set<string>([ADMIN_EMAIL]); // Allow multiple admin emails

// Session cleanup every hour to prevent memory leaks
setInterval(() => {
  // In a real implementation, you'd check session expiration times
  // For now, we'll keep sessions indefinitely until server restart
  console.log(`Active admin sessions: ${adminSessions.size}`);
}, 3600000);

export function generateSessionId(): string {
  // Use crypto.randomBytes for cryptographically secure random values
  const crypto = require('crypto');
  const randomBytes = crypto.randomBytes(32);
  return randomBytes.toString('hex') + Date.now().toString(36);
}

export function verifyAdminEmail(email: string): boolean {
  return adminEmails.has(email.toLowerCase());
}

export function addAdminEmail(email: string): void {
  adminEmails.add(email.toLowerCase());
}

export function createAdminSession(sessionId: string): void {
  adminSessions.add(sessionId);
}

export function destroyAdminSession(sessionId: string): void {
  adminSessions.delete(sessionId);
}

export function isValidAdminSession(sessionId: string): boolean {
  return adminSessions.has(sessionId);
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.admin_session;
  
  if (!sessionId || !isValidAdminSession(sessionId)) {
    return res.status(401).json({ 
      error: "Unauthorized", 
      message: "Admin authentication required" 
    });
  }
  
  next();
}

export function optionalAdminAuth(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.admin_session;
  (req as any).isAdminAuthenticated = sessionId && isValidAdminSession(sessionId);
  next();
}