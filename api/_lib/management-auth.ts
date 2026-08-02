import { createClient, type Session, type SupabaseClient, type User } from '@supabase/supabase-js';
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

type AuthenticationStatus =
  | 'authorized'
  | 'mfa_required'
  | 'mfa_enrollment_required'
  | 'unauthenticated'
  | 'unauthorized'
  | 'unavailable';

export interface ManagementAuthResult {
  status: AuthenticationStatus;
  user?: SessionUser;
}

export interface ManagementSignInResult extends ManagementAuthResult {
  session?: Session;
}

export interface ManagementMfaContext {
  client: SupabaseClient;
  session: Session;
  user: SessionUser;
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

function managementMfaRequired(): boolean {
  return String(process.env.MANAGEMENT_MFA_REQUIRED || 'true').toLowerCase() !== 'false';
}

async function getMfaStatus(client: SupabaseClient, accessToken: string, role: string): Promise<AuthenticationStatus> {
  const [assurance, factors] = await Promise.all([
    client.auth.mfa.getAuthenticatorAssuranceLevel(accessToken),
    client.auth.mfa.listFactors(),
  ]);

  if (assurance.error || factors.error) {
    return 'unavailable';
  }

  const verifiedTotpFactors = factors.data.totp.filter((factor) => factor.status === 'verified');
  if (assurance.data.currentLevel === 'aal2') {
    return 'authorized';
  }
  if (verifiedTotpFactors.length || assurance.data.nextLevel === 'aal2') {
    return 'mfa_required';
  }
  if (managementMfaRequired() && APPROVED_MANAGEMENT_ROLES.has(role)) {
    return 'mfa_enrollment_required';
  }
  return 'authorized';
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

    const status = await getMfaStatus(authClient, data.session.access_token, role);

    return {
      status,
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

  const sessionResult = await authClient.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  if (sessionResult.error || !sessionResult.data.user || !sessionResult.data.session) {
    clearAuthSessionCookies(res);
    return { status: 'unauthenticated' };
  }
  const user = sessionResult.data.user;
  const activeAccessToken = sessionResult.data.session.access_token;
  setAuthSessionCookies(res, sessionResult.data.session);

  try {
    const role = await getManagementRole(activeAccessToken, user.id);

    if (!role) {
      return { status: 'unauthorized' };
    }

    const status = await getMfaStatus(authClient, activeAccessToken, role);
    return { status, user: toSessionUser(user, role) };
  } catch {
    return { status: 'unavailable' };
  }
}

export async function getManagementMfaContext(req: VercelRequest, res: VercelResponse): Promise<ManagementMfaContext | null> {
  const accessToken = readCookie(req, ACCESS_COOKIE_NAME);
  const refreshToken = readCookie(req, REFRESH_COOKIE_NAME);
  if (!accessToken || !refreshToken) return null;

  try {
    const client = createSupabaseAuthClient();
    const result = await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (result.error || !result.data.session || !result.data.user) {
      clearAuthSessionCookies(res);
      return null;
    }

    const role = await getManagementRole(result.data.session.access_token, result.data.user.id);
    if (!role) return null;
    setAuthSessionCookies(res, result.data.session);
    return {
      client,
      session: result.data.session,
      user: toSessionUser(result.data.user, role),
    };
  } catch {
    return null;
  }
}

export function sessionFromMfaVerification(data: {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'bearer';
  user: User;
}): Session {
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
    token_type: data.token_type,
    user: data.user,
  };
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
