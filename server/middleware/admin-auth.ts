import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";

// Admin configuration validation
const adminEmail = process.env.ADMIN_EMAIL;
const adminUsername = process.env.ADMIN_USERNAME;
const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

if (!adminEmail || !adminUsername || !adminPasswordHash) {
  throw new Error('Missing required admin credentials. Please set ADMIN_EMAIL, ADMIN_USERNAME, and ADMIN_PASSWORD_HASH environment variables.');
}

// Type-safe admin configuration after validation
const ADMIN_EMAIL: string = adminEmail;
const ADMIN_USERNAME: string = adminUsername;
const ADMIN_PASSWORD_HASH: string = adminPasswordHash;

// Simple session store (in production, use Redis or database)
const adminSessions = new Set<string>();
const adminEmails = new Set<string>([ADMIN_EMAIL]); // Allow multiple admin emails

export function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function verifyAdminCredentials(username: string, password: string): Promise<boolean> {
  if (username !== ADMIN_USERNAME) {
    return false;
  }
  
  try {
    return await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
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