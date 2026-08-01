import { createClient, type Session, type User } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { SessionUser } from './session.js';

const ACCESS_COOKIE_NAME = 'en_sb_access_token';
const REFRESH_COOKIE_NAME = 'en_sb_refresh_token';
const APPROVED_MANAGEMENT_ROLES = new Set([
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGER',
  'ADVISOR',
  'MARKETING',
]);

type AuthenticationStatus = 'authorized' | 'unauthenticated' | 'unauthorized' | 'unavailable';

export interface ManagementAuthResult {
  status: AuthenticationStatus;
  user?: SessionUser;
}

export interface ManagementSignInResult extends ManagementAuthResult {
  session?: Session;
}

function getSupabaseAuthConfiguration() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error('Supabase Auth environment variables are not configured');
  }

  return { url, publishableKey };
}

export function createSupabaseAuthClient(accessToken?: string) {
  const { url, publishableKey } = getSupabaseAuthConfiguration();

  return createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    ...(accessToken ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } } : {}),
  });
}

function readCookie(req: VercelRequest, name: string): string | null {
  const cookieHeader = Array.isArray(req.headers.cookie) ? req.headers.cookie[0] : req.headers.cookie;
  const cookie = (cookieHeader || '')
    .split(';')
    .map((value: string) => value.trim())
    .find((value: string) => value.startsWith(`${name}=`));

  if (!cookie) {
    return null;
  }

  try {
    return decodeURIComponent(cookie.slice(name.length + 1));
  } catch {
    return null;
  }
}

function serializeCookie(name: string, value: string, maxAge: number): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';

  return `${name}=${encodeURIComponent(value)}; HttpOnly${secure}; SameSite=Strict; Path=/; Max-Age=${Math.max(0, Math.floor(maxAge))}`;
}

export function setAuthSessionCookies(res: VercelResponse, session: Session): void {
  const now = Math.floor(Date.now() / 1000);
  const accessMaxAge = Math.max(60, (session.expires_at || now + session.expires_in) - now);
  const refreshDays = Number.parseInt(process.env.SESSION_EXPIRY_DAYS || '', 10) || 7;

  res.setHeader('Set-Cookie', [
    serializeCookie(ACCESS_COOKIE_NAME, session.access_token, accessMaxAge),
    serializeCookie(REFRESH_COOKIE_NAME, session.refresh_token, refreshDays * 24 * 60 * 60),
  ]);
}

export function clearAuthSessionCookies(res: VercelResponse): void {
  res.setHeader('Set-Cookie', [
    serializeCookie(ACCESS_COOKIE_NAME, '', 0),
    serializeCookie(REFRESH_COOKIE_NAME, '', 0),
  ]);
}

async function getManagementRole(accessToken: string, userId: string): Promise<string | null> {
  const scopedClient = createSupabaseAuthClient(accessToken);
  const { data, error } = await scopedClient
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error('Management role lookup failed');
  }

  const role = String(data?.role || '').trim().toUpperCase();
  return APPROVED_MANAGEMENT_ROLES.has(role) ? role : null;
}

function optionalMetadataValue(metadata: Record<string, unknown>, key: string): string | null {
  const value = metadata[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function toSessionUser(user: User, role: string): SessionUser {
  const metadata = user.user_metadata || {};
  const email = user.email || '';

  return {
    id: user.id,
    username: optionalMetadataValue(metadata, 'username') || email.split('@')[0] || user.id,
    email,
    role,
    firstName: optionalMetadataValue(metadata, 'first_name') || optionalMetadataValue(metadata, 'firstName'),
    lastName: optionalMetadataValue(metadata, 'last_name') || optionalMetadataValue(metadata, 'lastName'),
    profileId: null,
  };
}

export async function signInManagementUser(email: string, password: string): Promise<ManagementSignInResult> {
  let authClient;

  try {
    authClient = createSupabaseAuthClient();
  } catch {
    return { status: 'unavailable' };
  }

  const { data, error } = await authClient.auth.signInWithPassword({ email, password });

  if (error || !data.user || !data.session) {
    return { status: 'unauthenticated' };
  }

  try {
    const role = await getManagementRole(data.session.access_token, data.user.id);

    if (!role) {
      await authClient.auth.signOut();
      return { status: 'unauthorized' };
    }

    return {
      status: 'authorized',
      user: toSessionUser(data.user, role),
      session: data.session,
    };
  } catch {
    await authClient.auth.signOut();
    return { status: 'unavailable' };
  }
}

export async function getManagementAuth(req: VercelRequest, res: VercelResponse): Promise<ManagementAuthResult> {
  const accessToken = readCookie(req, ACCESS_COOKIE_NAME);
  const refreshToken = readCookie(req, REFRESH_COOKIE_NAME);

  if (!accessToken || !refreshToken) {
    return { status: 'unauthenticated' };
  }

  let authClient;

  try {
    authClient = createSupabaseAuthClient();
  } catch {
    return { status: 'unavailable' };
  }

  let activeAccessToken = accessToken;
  let user: User | null = null;
  const verifiedUser = await authClient.auth.getUser(accessToken);

  if (!verifiedUser.error && verifiedUser.data.user) {
    user = verifiedUser.data.user;
  } else {
    const refreshed = await authClient.auth.refreshSession({ refresh_token: refreshToken });

    if (refreshed.error || !refreshed.data.user || !refreshed.data.session) {
      clearAuthSessionCookies(res);
      return { status: 'unauthenticated' };
    }

    user = refreshed.data.user;
    activeAccessToken = refreshed.data.session.access_token;
    setAuthSessionCookies(res, refreshed.data.session);
  }

  try {
    const role = await getManagementRole(activeAccessToken, user.id);

    if (!role) {
      return { status: 'unauthorized' };
    }

    return { status: 'authorized', user: toSessionUser(user, role) };
  } catch {
    return { status: 'unavailable' };
  }
}

export async function signOutManagementUser(req: VercelRequest): Promise<void> {
  const accessToken = readCookie(req, ACCESS_COOKIE_NAME);
  const refreshToken = readCookie(req, REFRESH_COOKIE_NAME);

  if (!accessToken || !refreshToken) {
    return;
  }

  try {
    const authClient = createSupabaseAuthClient();
    const sessionResult = await authClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (!sessionResult.error) {
      await authClient.auth.signOut();
    }
  } catch {
    return;
  }
}
