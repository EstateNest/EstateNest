import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.estatenest.ca');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Try to query users table
    const { data, error, status } = await supabase
      .from('users')
      .select('id, username, email, password_hash')
      .eq('username', 'EstateNest2026')
      .limit(1);

    return res.status(200).json({
      success: true,
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseServiceKey,
      urlLength: supabaseUrl.length,
      keyLength: supabaseServiceKey.length,
      data: data,
      error: error,
      status: status
    });

  } catch (error) {
    console.error('Debug error:', error);
    return res.status(500).json({
      error: 'Server Error',
      message: String(error)
    });
  }
}
