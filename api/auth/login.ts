import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Rate limiting (simple in-memory)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

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

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://www.estatenest.ca');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const ip = req.headers['x-forwarded-for'] as string || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many login attempts. Please try again later.',
    });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Username and password are required',
      });
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if it's an email or username
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
      return res.status(500).json({
        error: 'Server Error',
        message: 'An error occurred. Please try again.',
      });
    }

    const user = users?.[0];

    if (!user) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid username or password',
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        error: 'Account Disabled',
        message: 'Your account has been disabled.',
      });
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid username or password',
      });
    }

    // Success - generate a simple session token
    const sessionToken = Buffer.from(`${user.id}:${Date.now()}`).toString('base64url');

    // Set cookie header
    res.setHeader('Set-Cookie', `en_session=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`);

    return res.status(200).json({
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

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Server Error',
      message: 'An error occurred. Please try again.',
    });
  }
}
