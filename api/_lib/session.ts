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
