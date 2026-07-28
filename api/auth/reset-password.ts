import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.estatenest.ca');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, newPassword } = req.body;

    if (!username || !newPassword) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Username and newPassword are required',
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Password must be at least 8 characters',
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update the user's password
    const { data, error } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('username', username.toLowerCase())
      .select();

    if (error) {
      console.error('Update error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: error.message,
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully. You can now log in with your new password.',
    });

  } catch (error) {
    console.error('Reset error:', error);
    return res.status(500).json({
      error: 'Server Error',
      message: 'An error occurred. Please try again.',
    });
  }
}
