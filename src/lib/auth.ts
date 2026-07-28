// Authentication Library for EstateNest Management System
// Secure password hashing and session management

import { createHash, randomBytes, timingSafeEqual } from 'crypto';

const SALT_ROUNDS = 12;

// Environment-based secret for session signing
const AUTH_SECRET = process.env.AUTH_SECRET || 'dev-secret-change-in-production';
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'estatenest_session';
const SESSION_EXPIRY_DAYS = parseInt(process.env.SESSION_EXPIRY_DAYS || '7', 10);

// Rate limiting storage (in production, use Redis or database)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS_PER_HOUR || '5', 10);
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || '3600', 10) * 1000;

/**
 * Hash a password using bcrypt-style hashing with SHA-512
 * In production, use bcrypt or argon2
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha512')
    .update(salt + password + AUTH_SECRET)
    .digest('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a stored hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    
    const verifyHash = createHash('sha512')
      .update(salt + password + AUTH_SECRET)
      .digest('hex');
    
    const storedBuffer = Buffer.from(hash, 'hex');
    const verifyBuffer = Buffer.from(verifyHash, 'hex');
    
    if (storedBuffer.length !== verifyBuffer.length) return false;
    return timingSafeEqual(storedBuffer, verifyBuffer);
  } catch {
    return false;
  }
}

/**
 * Generate a secure session token
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Hash a session token for storage
 */
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token + AUTH_SECRET).digest('hex');
}

/**
 * Check if IP is rate limited
 */
export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  
  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }
  
  if (record.count >= MAX_ATTEMPTS) {
    return true;
  }
  
  record.count++;
  return false;
}

/**
 * Get remaining attempts for IP
 */
export function getRemainingAttempts(ip: string): number {
  const record = loginAttempts.get(ip);
  if (!record) return MAX_ATTEMPTS;
  if (Date.now() > record.resetAt) return MAX_ATTEMPTS;
  return Math.max(0, MAX_ATTEMPTS - record.count);
}

/**
 * Clear rate limit for IP (on successful login)
 */
export function clearRateLimit(ip: string): void {
  loginAttempts.delete(ip);
}

/**
 * Create session cookie options
 */
export function getSessionCookieOptions() {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

/**
 * Get session cookie name
 */
export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

/**
 * Calculate session expiry date
 */
export function getSessionExpiry(): Date {
  return new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .slice(0, 1000); // Limit length
}

/**
 * Validate username format
 */
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
  return usernameRegex.test(username);
}
