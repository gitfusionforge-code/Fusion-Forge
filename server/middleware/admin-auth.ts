import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// Admin configuration validation
const adminEmail = process.env.ADMIN_EMAIL;

if (!adminEmail) {
  throw new Error('Missing required admin email. Please set ADMIN_EMAIL environment variable.');
}

// Type-safe admin configuration after validation
const ADMIN_EMAIL: string = adminEmail;

// Production-ready session store with expiration
interface SessionData {
  id: string;
  email: string;
  createdAt: number;
  expiresAt: number;
}

const adminSessions = new Map<string, SessionData>();
const adminEmails = new Set<string>([ADMIN_EMAIL]); // Allow multiple admin emails
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Session cleanup every 30 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  let expiredCount = 0;
  
  const expiredSessions: string[] = [];
  adminSessions.forEach((session, sessionId) => {
    if (now > session.expiresAt) {
      expiredSessions.push(sessionId);
    }
  });
  expiredSessions.forEach(sessionId => {
    adminSessions.delete(sessionId);
    expiredCount++;
  });
  
  console.log(`Session cleanup: ${expiredCount} expired, ${adminSessions.size} active sessions`);
}, 30 * 60 * 1000); // 30 minutes

export function generateSessionId(): string {
  // Use crypto.randomBytes for cryptographically secure random values
  const randomBytes = crypto.randomBytes(32);
  return randomBytes.toString('hex') + Date.now().toString(36);
}

export function verifyAdminEmail(email: string): boolean {
  return adminEmails.has(email.toLowerCase());
}

export function addAdminEmail(email: string): void {
  adminEmails.add(email.toLowerCase());
}

export function createAdminSession(sessionId: string, email: string): void {
  const now = Date.now();
  const sessionData: SessionData = {
    id: sessionId,
    email,
    createdAt: now,
    expiresAt: now + SESSION_DURATION
  };
  adminSessions.set(sessionId, sessionData);
  console.log(`Admin session created for ${email}, expires in 24 hours`);
}

export function destroyAdminSession(sessionId: string): void {
  const session = adminSessions.get(sessionId);
  if (session) {
    console.log(`Admin session destroyed for ${session.email}`);
    adminSessions.delete(sessionId);
  }
}

export function isValidAdminSession(sessionId: string): boolean {
  const session = adminSessions.get(sessionId);
  if (!session) return false;
  
  const now = Date.now();
  if (now > session.expiresAt) {
    adminSessions.delete(sessionId);
    console.log(`Expired admin session removed for ${session.email}`);
    return false;
  }
  
  return true;
}

export function refreshAdminSession(sessionId: string): boolean {
  const session = adminSessions.get(sessionId);
  if (!session || !isValidAdminSession(sessionId)) return false;
  
  session.expiresAt = Date.now() + SESSION_DURATION;
  adminSessions.set(sessionId, session);
  return true;
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.admin_session;
  
  if (!sessionId || !isValidAdminSession(sessionId)) {
    return res.status(401).json({ 
      error: "Unauthorized", 
      message: "Admin authentication required or session expired" 
    });
  }
  
  // Refresh session on each valid request
  refreshAdminSession(sessionId);
  
  next();
}

export function optionalAdminAuth(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.admin_session;
  (req as any).isAdminAuthenticated = sessionId && isValidAdminSession(sessionId);
  next();
}