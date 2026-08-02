import { isIP } from 'node:net';
import type { VercelRequest } from '@vercel/node';

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  role: string;
  firstName?: string | null;
  lastName?: string | null;
  profileId?: string | null;
}

export function isTrustedOrigin(req: VercelRequest): boolean {
  const origin = Array.isArray(req.headers.origin) ? req.headers.origin[0] : req.headers.origin;

  if (!origin) {
    return true;
  }

  try {
    const originUrl = new URL(origin);
    const forwardedHost = Array.isArray(req.headers['x-forwarded-host'])
      ? req.headers['x-forwarded-host'][0]
      : req.headers['x-forwarded-host'];
    const host = forwardedHost || req.headers.host;
    const requestHost = host?.split(',')[0]?.trim().toLowerCase();

    if (requestHost && ['https:', 'http:'].includes(originUrl.protocol) && originUrl.host.toLowerCase() === requestHost) {
      return true;
    }
  } catch {
    return false;
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
  const candidate = value?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
  return isIP(candidate) ? candidate : '0.0.0.0';
}
