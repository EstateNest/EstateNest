import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Hardcoded admin credentials for development/fallback
const ADMIN_CREDENTIALS = {
  username: 'admin',
  email: 'admin@estatenest.ca',
  password: 'TestEN'
};

// Rate limiting (simple in-memory)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }
  
  if (record.count >= RATE_LIMIT) {
    return true;
  }
  
  record.count++;
  return false;
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

const app = new Hono();

// CORS
app.use('*', cors({
  origin: 'https://www.estatenest.ca',
  credentials: true,
}));

app.post('/', async (c) => {
  // Rate limiting
  const ip = c.req.header('x-forwarded-for') || 'unknown';
  if (isRateLimited(ip)) {
    return c.json({
      error: 'Too Many Requests',
      message: 'Too many login attempts. Please try again later.',
    }, 429);
  }

  try {
    const { username, password } = await c.req.json();

    if (!username || !password) {
      return c.json({
        error: 'Validation Error',
        message: 'Username and password are required',
      }, 400);
    }

    // Check hardcoded admin credentials first (fallback)
    if ((username.toLowerCase() === ADMIN_CREDENTIALS.username || 
         username.toLowerCase() === ADMIN_CREDENTIALS.email) && 
        password === ADMIN_CREDENTIALS.password) {
      const sessionToken = Buffer.from(`admin:${Date.now()}`).toString('base64url');
      c.header('Set-Cookie', `en_session=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`);
      return c.json({
        success: true,
        user: {
          id: 'admin-001',
          username: 'admin',
          email: 'admin@estatenest.ca',
          role: 'admin',
          firstName: 'Admin',
          lastName: 'User',
        },
        message: 'Login successful',
      });
    }

    // Try Supabase if configured
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const isEmail = username.includes('@');
      
      let query = supabase.from('users').select('*');
      if (isEmail) {
        query = query.eq('email', username.toLowerCase());
      } else {
        query = query.ilike('username', username);
      }

      const { data: users, error: userError } = await query.limit(1);

      if (userError) {
        console.error('Database error:', userError);
        return c.json({
          error: 'Server Error',
          message: 'An error occurred. Please try again.',
        }, 500);
      }

      const user = users?.[0];

      if (!user) {
        return c.json({
          error: 'Authentication Failed',
          message: 'Invalid username or password',
        }, 401);
      }

      if (!user.is_active) {
        return c.json({
          error: 'Account Disabled',
          message: 'Your account has been disabled.',
        }, 403);
      }

      const isValid = await verifyPassword(password, user.password_hash);

      if (!isValid) {
        return c.json({
          error: 'Authentication Failed',
          message: 'Invalid username or password',
        }, 401);
      }

      const sessionToken = Buffer.from(`${user.id}:${Date.now()}`).toString('base64url');
      c.header('Set-Cookie', `en_session=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`);

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
    }

    // No Supabase configured and credentials don't match hardcoded
    return c.json({
      error: 'Authentication Failed',
      message: 'Invalid username or password',
    }, 401);

  } catch (error) {
    console.error('Login error:', error);
    return c.json({
      error: 'Server Error',
      message: 'An error occurred. Please try again.',
    }, 500);
  }
});

export default app;
