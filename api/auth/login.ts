import type { VercelRequest, VercelResponse } from '@vercel/node';

// Admin credentials for Estate Nest CRM
// In production, use Supabase with proper user management
const ADMIN_CREDENTIALS = {
  username: 'EstateNest2026',
  email: 'kanwar@estatenest.ca',
  password: 'TestEN'
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers - allow all origins for flexibility
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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
          username: 'EstateNest2026',
          email: 'kanwar@estatenest.ca',
          role: 'admin',
          firstName: 'Kanwar',
          lastName: 'Admin',
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
