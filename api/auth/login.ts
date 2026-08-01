import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { getSupabaseAdmin } from '../_lib/supabase.js';
import {
  createSessionCookie,
  createSessionToken,
  getRequestIp,
  isTrustedOrigin,
  type SessionUser,
} from '../_lib/session.js';

const LOGIN_WINDOW_MINUTES = 60;

interface DatabaseUser {
  id: string;
  username: string;
  email: string;
  role: string | null;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  password_hash: string | null;
}

function normalizeUser(user: DatabaseUser): SessionUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: String(user.role || 'ADVISOR').toUpperCase(),
    firstName: user.first_name,
    lastName: user.last_name,
  };
}

async function findDatabaseUser(identifier: string): Promise<DatabaseUser | null> {
  const supabase = getSupabaseAdmin();
  const usernameResult = await supabase
    .from('users')
    .select('*')
    .ilike('username', identifier)
    .maybeSingle();

  if (usernameResult.data) {
    return usernameResult.data as DatabaseUser;
  }

  const emailResult = await supabase
    .from('users')
    .select('*')
    .ilike('email', identifier)
    .maybeSingle();

  return emailResult.data as DatabaseUser | null;
}

function getEnvironmentAdmin(identifier: string, password: string): SessionUser | null {
  const username = process.env.INITIAL_ADMIN_USERNAME;
  const email = process.env.INITIAL_ADMIN_EMAIL;
  const configuredPassword = process.env.INITIAL_ADMIN_PASSWORD;

  if (!username || !email || !configuredPassword) {
    return null;
  }

  const normalizedIdentifier = identifier.toLowerCase();
  const matchesIdentifier = normalizedIdentifier === username.toLowerCase() || normalizedIdentifier === email.toLowerCase();

  if (!matchesIdentifier || password !== configuredPassword) {
    return null;
  }

  return {
    id: 'environment-admin',
    username,
    email,
    role: 'ADMIN',
    firstName: 'Estate Nest',
    lastName: 'Administrator',
  };
}

async function isRateLimited(ipAddress: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();
    const windowStart = new Date(Date.now() - LOGIN_WINDOW_MINUTES * 60 * 1000).toISOString();
    const maxAttempts = Number.parseInt(process.env.MAX_LOGIN_ATTEMPTS_PER_HOUR || '', 10) || 8;
    const { count } = await supabase
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

async function recordLoginAttempt(identifier: string, ipAddress: string, success: boolean) {
  try {
    await getSupabaseAdmin().from('login_attempts').insert({
      email_or_username: identifier.slice(0, 255),
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

  const identifier = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');

  if (!identifier || !password || identifier.length > 255 || password.length > 512) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const ipAddress = getRequestIp(req);

  if (await isRateLimited(ipAddress)) {
    return res.status(429).json({ message: 'Too many sign-in attempts. Please try again later.' });
  }

  let sessionUser: SessionUser | null = null;

  try {
    const databaseUser = await findDatabaseUser(identifier);

    if (databaseUser?.is_active && await bcrypt.compare(password, databaseUser.password_hash || '')) {
      sessionUser = normalizeUser(databaseUser);
      await getSupabaseAdmin()
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', databaseUser.id);
    }
  } catch (error) {
    console.error('Database authentication unavailable:', error instanceof Error ? error.message : 'Unknown error');
  }

  if (!sessionUser) {
    sessionUser = getEnvironmentAdmin(identifier, password);
  }

  if (!sessionUser) {
    await recordLoginAttempt(identifier, ipAddress, false);
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  try {
    const sessionToken = createSessionToken(sessionUser);
    await recordLoginAttempt(identifier, ipAddress, true);
    res.setHeader('Set-Cookie', createSessionCookie(sessionToken));

    return res.status(200).json({ success: true, user: sessionUser });
  } catch (error) {
    console.error('Session creation failed:', error instanceof Error ? error.message : 'Unknown error');
    return res.status(503).json({ message: 'Management authentication is not configured' });
  }
}
