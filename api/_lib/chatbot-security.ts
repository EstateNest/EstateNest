import { createHash, createHmac, randomBytes } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const CHATBOT_SESSION_COOKIE = 'en_chatbot_session';
export const CHATBOT_HANDOFF_COOKIE = 'en_quote_handoff';

const EMAIL_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]{1,119}$/u;
const SCRIPT_PATTERN = /<\/?script|javascript:|onerror\s*=|onload\s*=|<[^>]+>/i;
const SENSITIVE_PATTERN = /\b(?:social insurance(?: number)?|bank account|banking information|routing number|transit number|credit card|debit card|card number|password|passcode|passport|driver'?s licen[cs]e|health card|medical report|medical condition|diagnosis|medication|prescription)\b/i;
const SIN_PATTERN = /(?:^|\D)\d{3}[ -]?\d{3}[ -]?\d{3}(?:\D|$)/;

export interface ValidatedContact {
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email: string;
}

export function randomOpaqueToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashOpaqueToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function readCookie(req: VercelRequest, name: string): string | null {
  const header = Array.isArray(req.headers.cookie) ? req.headers.cookie[0] : req.headers.cookie;
  const entry = (header || '')
    .split(';')
    .map((value: string) => value.trim())
    .find((value: string) => value.startsWith(`${name}=`));
  if (!entry) return null;
  try {
    return decodeURIComponent(entry.slice(name.length + 1));
  } catch {
    return null;
  }
}

function serializeCookie(name: string, value: string, maxAge: number): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${name}=${encodeURIComponent(value)}; HttpOnly${secure}; SameSite=Strict; Path=/; Max-Age=${Math.max(0, Math.floor(maxAge))}`;
}

export function setPrivateCookie(res: VercelResponse, name: string, value: string, maxAge: number): void {
  const current = res.getHeader('Set-Cookie');
  const cookies = Array.isArray(current) ? current.map(String) : current ? [String(current)] : [];
  res.setHeader('Set-Cookie', [...cookies, serializeCookie(name, value, maxAge)]);
}

export function clearPrivateCookie(res: VercelResponse, name: string): void {
  setPrivateCookie(res, name, '', 0);
}

function requestHeader(req: VercelRequest, name: string): string {
  const value = req.headers[name];
  return String(Array.isArray(value) ? value[0] || '' : value || '').slice(0, 2000);
}

export function requestFingerprint(req: VercelRequest, ipAddress: string): { ipHash: string; userAgentHash: string } {
  const secret = process.env.CHATBOT_HASH_SECRET || process.env.AUTH_SECRET || process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error('Chatbot security configuration is unavailable');
  const hash = (value: string) => createHmac('sha256', secret).update(value).digest('hex');
  return {
    ipHash: hash(ipAddress),
    userAgentHash: hash(requestHeader(req, 'user-agent') || 'unknown'),
  };
}

function safeUrl(value: unknown, pathOnly: boolean): string {
  const raw = String(value || '').trim().slice(0, 1500);
  if (!raw) return '';
  try {
    const parsed = new URL(raw, 'https://www.estatenest.ca');
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    return pathOnly ? parsed.pathname.slice(0, 500) || '/' : `${parsed.origin}${parsed.pathname}`.slice(0, 1000);
  } catch {
    return '';
  }
}

export function safeSourcePage(value: unknown): string {
  return safeUrl(value, true) || '/';
}

export function safeReferrer(value: unknown): string {
  return safeUrl(value, false);
}

export function safeUtm(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const input = value as Record<string, unknown>;
  const output: Record<string, string> = {};
  for (const key of ['source', 'medium', 'campaign', 'term', 'content']) {
    const normalized = String(input[key] || '').trim().replace(/[<>]/g, '').slice(0, 100);
    if (normalized) output[key] = normalized;
  }
  return output;
}

function passesLuhn(value: string): boolean {
  let sum = 0;
  let doubleDigit = false;
  for (let index = value.length - 1; index >= 0; index -= 1) {
    let digit = Number(value[index]);
    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleDigit = !doubleDigit;
  }
  return sum % 10 === 0;
}

export function containsSensitiveOrMaliciousInput(value: unknown): boolean {
  const text = String(value || '').trim();
  if (!text) return false;
  if (SCRIPT_PATTERN.test(text) || SENSITIVE_PATTERN.test(text) || SIN_PATTERN.test(text)) return true;
  const digits = text.replace(/\D/g, '');
  return digits.length >= 13 && digits.length <= 19 && passesLuhn(digits);
}

export function validateContactInput(value: unknown): { contact?: ValidatedContact; field?: string; message?: string; sensitive?: boolean } {
  const data = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const fullName = String(data.fullName || '').trim().replace(/\s+/g, ' ').slice(0, 140);
  const email = String(data.email || '').trim().toLowerCase().slice(0, 255);
  const rawPhone = String(data.phone || '').trim().slice(0, 50);

  if ([fullName, email, rawPhone].some(containsSensitiveOrMaliciousInput)) {
    return { field: 'contact', message: 'Please do not enter sensitive information in this chat.', sensitive: true };
  }
  if (!NAME_PATTERN.test(fullName)) {
    return { field: 'fullName', message: 'Enter your name using letters, spaces, apostrophes, periods, or hyphens.' };
  }
  const phoneDigits = rawPhone.replace(/\D/g, '');
  const nationalNumber = phoneDigits.length === 11 && phoneDigits.startsWith('1') ? phoneDigits.slice(1) : phoneDigits;
  if (nationalNumber.length !== 10 || nationalNumber.startsWith('0') || nationalNumber.startsWith('1')) {
    return { field: 'phone', message: 'Enter a valid 10-digit Canadian or US phone number.' };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { field: 'email', message: 'Enter a valid email address.' };
  }

  const nameParts = fullName.split(' ');
  const firstName = nameParts.shift() || fullName;
  const lastName = nameParts.join(' ');
  return {
    contact: {
      fullName,
      firstName,
      lastName,
      phone: `+1${nationalNumber}`,
      email,
    },
  };
}

export function chatbotRetentionDays(): number {
  const parsed = Number.parseInt(process.env.CHATBOT_RETENTION_DAYS || '', 10);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 30), 730) : 180;
}

export function chatbotHandoffSeconds(): number {
  const parsed = Number.parseInt(process.env.CHATBOT_HANDOFF_SECONDS || '', 10);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 300), 1800) : 1200;
}
