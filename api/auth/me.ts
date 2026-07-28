import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Hardcoded admin user for fallback
const ADMIN_USER = {
  id: 'admin-001',
  username: 'admin',
  email: 'admin@estatenest.ca',
  role: 'admin',
  first_name: 'Admin',
  last_name: 'User',
  is_active: true
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.estatenest.ca');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get session cookie
  const cookies = req.headers.cookie || '';
  const sessionCookie = cookies.split(';').find(c => c.trim().startsWith('en_session='));

  if (!sessionCookie) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    // Decode session token
    const token = sessionCookie.split('=')[1];
    const decoded = Buffer.from(token, 'base64url').toString();
    const [userId] = decoded.split(':');

    if (!userId) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Check for hardcoded admin user
    if (userId === 'admin') {
      return res.status(200).json({
        success: true,
        user: {
          id: ADMIN_USER.id,
          username: ADMIN_USER.username,
          email: ADMIN_USER.email,
          role: ADMIN_USER.role,
          firstName: ADMIN_USER.first_name,
          lastName: ADMIN_USER.last_name,
        }
      });
    }

    // Get user from database (if Supabase is configured)
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: user, error } = await supabase
        .from('users')
        .select('id, username, email, role, first_name, last_name, is_active')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return res.status(401).json({ error: 'User not found' });
      }

      if (!user.is_active) {
        return res.status(403).json({ error: 'Account disabled' });
      }

      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          firstName: user.first_name,
          lastName: user.last_name,
        }
      });
    }

    // No Supabase configured and not admin
    return res.status(401).json({ error: 'User not found' });

  } catch (error) {
    console.error('Auth check error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
