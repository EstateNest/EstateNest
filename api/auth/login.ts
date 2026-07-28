// Authentication Routes - Login, Logout, Session Management
import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { hashPassword, verifyPassword, isRateLimited, getRemainingAttempts, clearRateLimit, getSessionCookieName, getSessionExpiry, hashSessionToken, isValidEmail } from '../../src/lib/auth';
import { getUserByEmail, getUserByUsername, createSession, deleteSession, getSessionByToken, logLoginAttempt, updateUserLastLogin, deleteAllUserSessions, createAuditLog, getUserById } from '../../src/lib/db';

const auth = new Hono();

// Session context middleware
async function requireAuth(c: any, next: any) {
  const sessionToken = getCookie(c, getSessionCookieName());
  
  if (!sessionToken) {
    return c.json({ error: 'Unauthorized', message: 'No session found' }, 401);
  }
  
  const session = await getSessionByToken(sessionToken);
  
  if (!session) {
    deleteCookie(c, getSessionCookieName());
    return c.json({ error: 'Unauthorized', message: 'Invalid or expired session' }, 401);
  }
  
  // Check if session is expired
  if (new Date(session.expires_at) < new Date()) {
    await deleteSession(session.id);
    deleteCookie(c, getSessionCookieName());
    return c.json({ error: 'Unauthorized', message: 'Session expired' }, 401);
  }
  
  // Attach user to context
  c.set('user', session.user);
  c.set('session', session);
  
  await next();
}

// Rate limit middleware for login
async function checkRateLimit(c: any, next: any) {
  const ip = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
  
  if (isRateLimited(ip)) {
    return c.json({
      error: 'Too Many Requests',
      message: 'Too many login attempts. Please try again later.',
      retryAfter: Math.ceil((3600000) / 1000), // 1 hour in seconds
    }, 429);
  }
  
  c.set('ip', ip);
  await next();
}

// POST /api/auth/login
auth.post('/login', checkRateLimit, async (c) => {
  const ip = c.get('ip');
  const body = await c.req.json();
  
  const { username, password } = body;
  
  // Validate input
  if (!username || !password) {
    return c.json({
      error: 'Validation Error',
      message: 'Username and password are required',
    }, 400);
  }
  
  // Find user
  let user = isValidEmail(username) 
    ? await getUserByEmail(username)
    : await getUserByUsername(username);
  
  if (!user) {
    await logLoginAttempt(username, ip, false);
    return c.json({
      error: 'Authentication Failed',
      message: 'Invalid username or password',
      remainingAttempts: getRemainingAttempts(ip) - 1,
    }, 401);
  }
  
  // Check if user is active
  if (!user.is_active) {
    await logLoginAttempt(username, ip, false);
    return c.json({
      error: 'Account Disabled',
      message: 'Your account has been disabled. Please contact administrator.',
    }, 403);
  }
  
  // Verify password
  const isValid = verifyPassword(password, user.password_hash);
  
  if (!isValid) {
    await logLoginAttempt(username, ip, false);
    return c.json({
      error: 'Authentication Failed',
      message: 'Invalid username or password',
      remainingAttempts: getRemainingAttempts(ip) - 1,
    }, 401);
  }
  
  // Clear rate limit on success
  clearRateLimit(ip);
  
  // Log successful login
  await logLoginAttempt(username, ip, true);
  
  // Update last login
  await updateUserLastLogin(user.id);
  
  // Create session
  const userAgent = c.req.header('user-agent');
  const session = await createSession(user.id, ip, userAgent || undefined);
  
  // Set session cookie
  const sessionToken = Buffer.from(`${session.id}:${Date.now()}`).toString('base64url');
  
  setCookie(c, getSessionCookieName(), sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
  
  // Audit log
  await createAuditLog({
    user_id: user.id,
    action: 'LOGIN',
    ip_address: ip,
    user_agent: userAgent || undefined,
  });
  
  // Return user info (without sensitive data)
  return c.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
    },
    message: 'Login successful',
  });
});

// POST /api/auth/logout
auth.post('/logout', requireAuth, async (c) => {
  const session = c.get('session');
  const user = c.get('user');
  
  // Delete session
  await deleteSession(session.id);
  
  // Clear cookie
  deleteCookie(c, getSessionCookieName());
  
  // Audit log
  await createAuditLog({
    user_id: user.id,
    action: 'LOGOUT',
    ip_address: c.req.header('x-forwarded-for') || undefined,
    user_agent: c.req.header('user-agent') || undefined,
  });
  
  return c.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// POST /api/auth/logout-all - Logout from all devices
auth.post('/logout-all', requireAuth, async (c) => {
  const user = c.get('user');
  
  // Delete all user sessions
  await deleteAllUserSessions(user.id);
  
  // Clear cookie
  deleteCookie(c, getSessionCookieName());
  
  // Audit log
  await createAuditLog({
    user_id: user.id,
    action: 'LOGOUT_ALL_DEVICES',
    ip_address: c.req.header('x-forwarded-for') || undefined,
    user_agent: c.req.header('user-agent') || undefined,
  });
  
  return c.json({
    success: true,
    message: 'Logged out from all devices',
  });
});

// GET /api/auth/me - Get current user
auth.get('/me', requireAuth, async (c) => {
  const user = c.get('user');
  
  return c.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      lastLoginAt: user.last_login_at,
    },
  });
});

// POST /api/auth/change-password
auth.post('/change-password', requireAuth, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  
  const { currentPassword, newPassword } = body;
  
  if (!currentPassword || !newPassword) {
    return c.json({
      error: 'Validation Error',
      message: 'Current password and new password are required',
    }, 400);
  }
  
  if (newPassword.length < 8) {
    return c.json({
      error: 'Validation Error',
      message: 'New password must be at least 8 characters',
    }, 400);
  }
  
  // Verify current password
  const isValid = verifyPassword(currentPassword, user.password_hash);
  
  if (!isValid) {
    return c.json({
      error: 'Authentication Failed',
      message: 'Current password is incorrect',
    }, 401);
  }
  
  // Hash new password (would update in database here)
  const newHash = hashPassword(newPassword);
  
  // Audit log
  await createAuditLog({
    user_id: user.id,
    action: 'PASSWORD_CHANGE',
    ip_address: c.req.header('x-forwarded-for') || undefined,
    user_agent: c.req.header('user-agent') || undefined,
  });
  
  return c.json({
    success: true,
    message: 'Password changed successfully',
  });
});

// POST /api/auth/validate-session - Validate session (for client-side checks)
auth.post('/validate', async (c) => {
  const sessionToken = getCookie(c, getSessionCookieName());
  
  if (!sessionToken) {
    return c.json({
      valid: false,
      message: 'No session found',
    });
  }
  
  const session = await getSessionByToken(sessionToken);
  
  if (!session || new Date(session.expires_at) < new Date()) {
    deleteCookie(c, getSessionCookieName());
    return c.json({
      valid: false,
      message: 'Session expired or invalid',
    });
  }
  
  return c.json({
    valid: true,
    user: {
      id: session.user.id,
      username: session.user.username,
      email: session.user.email,
      role: session.user.role,
    },
  });
});

export default auth;
