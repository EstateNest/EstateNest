import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { VercelRequest } from '@vercel/node';

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  role: string;
  firstName?: string | null;
  lastName?: string | null;
}
interface SessionPayload extends SessionUser {
  issuedAt: number;
  expiresAt: number;
  nonce: string;
}

const DEFAULT_COOKIE_NAME = 'en_session';
const DEFAULT_SESSION_DAYS = 7;

function getSessionSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.SUPABASE_SECRET_KEY;

  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET must be configured with at least 32 characters');
  }

  return secret;
}

function encode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function decode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(payload: string): string {
  return createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
}

export function getSessionCookieName(): string {
  return process.env.SESSION_COOKIE_NAME || DEFAULT_COOKIE_NAME;
}

export function createSessionToken(user: SessionUser): string {
  const now = Math.floor(Date.now() / 1000);
  const sessionDays = Number.parseInt(process.env.SESSION_EXPIRY_DAYS || '', 10) || DEFAULT_SESSION_DAYS;
  const payload: SessionPayload = {
    ...user,
    issuedAt: now,
    expiresAt: now + sessionDays * 24 * 60 * 60,
    nonce: randomBytes(16).toString('base64url'),
  };
  const encodedPayload = encode(JSON.stringify(payload));

  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const [encodedPayload, suppliedSignature] = token.split('.');

    if (!encodedPayload || !suppliedSignature) {
      return null;
    }

    const expectedSignature = sign(encodedPayload);
    const suppliedBuffer = Buffer.from(suppliedSignature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      suppliedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(suppliedBuffer, expectedBuffer)
    ) {
      return null;
    }

    const payload = JSON.parse(decode(encodedPayload)) as SessionPayload;

    if (!payload.id || !payload.expiresAt || payload.expiresAt <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getSessionUser(req: VercelRequest): SessionUser | null {
  const cookieHeader = req.headers.cookie || '';
  const cookieName = getSessionCookieName();
  const sessionCookie = cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${cookieName}=`));

  if (!sessionCookie) {
    return null;
  }

  const token = decodeURIComponent(sessionCookie.slice(cookieName.length + 1));
  const payload = verifySessionToken(token);

  if (!payload) {
    return null;
  }

  return {
    id: payload.id,
    username: payload.username,
    email: payload.email,
    role: payload.role,
    firstName: payload.firstName,
    lastName: payload.lastName,
  };
}

export function createSessionCookie(token: string): string {
  const sessionDays = Number.parseInt(process.env.SESSION_EXPIRY_DAYS || '', 10) || DEFAULT_SESSION_DAYS;
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';

  return `${getSessionCookieName()}=${encodeURIComponent(token)}; HttpOnly${secure}; SameSite=Strict; Path=/; Max-Age=${sessionDays * 24 * 60 * 60}`;
}

export function createExpiredSessionCookie(): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';

  return `${getSessionCookieName()}=; HttpOnly${secure}; SameSite=Strict; Path=/; Max-Age=0`;
}

export function isTrustedOrigin(req: VercelRequest): boolean {
  const origin = Array.isArray(req.headers.origin) ? req.headers.origin[0] : req.headers.origin;

  if (!origin) {
    return true;
  }

  const configuredOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const allowedOrigins = new Set([
    'https://www.estatenest.ca',
    'https://estatenest.ca',
    'http://localhost:5173',
    ...configuredOrigins,
  ]);

  return allowedOrigins.has(origin);
}

export function getRequestIp(req: VercelRequest): string {
  const forwardedFor = req.headers['x-forwarded-for'];
  const value = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;

  return value?.split(',')[0]?.trim() || req.socket.remoteAddress || '0.0.0.0';
}
