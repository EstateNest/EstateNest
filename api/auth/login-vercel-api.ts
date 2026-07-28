import type { VercelRequest, VercelResponse } from '@vercel/node';

// Hardcoded admin credentials for development/fallback
// In production, use Supabase with proper user management
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

    // Check hardcoded admin credentials
    if ((username.toLowerCase() === ADMIN_CREDENTIALS.username || 
         username.toLowerCase() === ADMIN_CREDENTIALS.email) && 
        password === ADMIN_CREDENTIALS.password) {
      const sessionToken = Buffer.from(`admin:${Date.now()}`).toString('base64url');
      
      res.setHeader('Set-Cookie', `en_session=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`);
      
      return res.status(200).json({
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

    // Invalid credentials
    return res.status(401).json({
      error: 'Authentication Failed',
      message: 'Invalid username or password',
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Server Error',
      message: 'An error occurred. Please try again.',
    });
  }
}
