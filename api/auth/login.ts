import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setAuthSessionCookies, signInManagementUser } from '../_lib/management-auth.js';
import { getRequestIp, isTrustedOrigin } from '../_lib/session.js';
import { getSupabaseAdmin } from '../_lib/supabase.js';

const LOGIN_WINDOW_MINUTES = 60;

async function isRateLimited(ipAddress: string): Promise<boolean> {
  try {
    const windowStart = new Date(Date.now() - LOGIN_WINDOW_MINUTES * 60 * 1000).toISOString();
    const maxAttempts = Number.parseInt(process.env.MAX_LOGIN_ATTEMPTS_PER_HOUR || '', 10) || 8;
    const { count } = await getSupabaseAdmin()
      .from('login_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ipAddress)
      .eq('success', false)
      .gte('attempted_at', windowStart);

    return (count || 0) >= maxAttempts;
  } catch {
    return false;
  }
}

async function recordLoginAttempt(email: string, ipAddress: string, success: boolean) {
  try {
    await getSupabaseAdmin().from('login_attempts').insert({
      email_or_username: email.slice(0, 255),
      ip_address: ipAddress,
      success,
    });
  } catch {
    return;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isTrustedOrigin(req)) {
    return res.status(403).json({ error: 'Invalid request origin' });
  }

  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!email || !password || email.length > 255 || password.length > 512 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const ipAddress = getRequestIp(req);

  if (await isRateLimited(ipAddress)) {
    return res.status(429).json({ message: 'Too many sign-in attempts. Please try again later.' });
  }

  const result = await signInManagementUser(email, password);

  if (result.status === 'unauthenticated') {
    await recordLoginAttempt(email, ipAddress, false);
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  if (result.status === 'unauthorized') {
    await recordLoginAttempt(email, ipAddress, false);
    return res.status(403).json({ message: 'Management access is not authorized.' });
  }

  if (!result.user || !result.session) {
    return res.status(503).json({ message: 'Management authentication is temporarily unavailable.' });
  }

  setAuthSessionCookies(res, result.session);
  await recordLoginAttempt(email, ipAddress, true);

  if (result.status === 'mfa_required' || result.status === 'mfa_enrollment_required') {
    return res.status(202).json({
      success: false,
      mfaRequired: result.status === 'mfa_required',
      mfaEnrollmentRequired: result.status === 'mfa_enrollment_required',
    });
  }

  if (result.status !== 'authorized') {
    return res.status(503).json({ message: 'Management authentication is temporarily unavailable.' });
  }

  return res.status(200).json({ success: true, user: result.user });
}
