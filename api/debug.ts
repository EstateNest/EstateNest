import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.estatenest.ca');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    if (req.method === 'GET') {
      // Query users
      const { data, error, status } = await supabase
        .from('users')
        .select('id, username, email, password_hash')
        .limit(1);

      return res.status(200).json({
        success: true,
        data: data,
        error: error,
        status: status
      });
    }

    if (req.method === 'POST') {
      // Reset password for EstateNest2026
      const passwordHash = await bcrypt.hash('EstateNest2024!', 12);
      
      const { data, error, status } = await supabase
        .from('users')
        .update({ password_hash: passwordHash })
        .eq('username', 'EstateNest2026')
        .select();

      return res.status(200).json({
        success: true,
        reset: true,
        data: data,
        error: error,
        status: status
      });
    }

  } catch (error) {
    console.error('Debug error:', error);
    return res.status(500).json({
      error: 'Server Error',
      message: String(error)
    });
  }
}
