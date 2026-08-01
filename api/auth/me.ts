import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSessionUser } from '../_lib/session.js';
import { getSupabaseAdmin } from '../_lib/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sessionUser = getSessionUser(req);

  if (!sessionUser) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (sessionUser.id !== 'environment-admin') {
    try {
      const { data: user } = await getSupabaseAdmin()
        .from('users')
        .select('id, username, email, role, first_name, last_name, is_active')
        .eq('id', sessionUser.id)
        .maybeSingle();

      if (!user?.is_active) {
        return res.status(401).json({ error: 'Account is no longer active' });
      }

      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: String(user.role).toUpperCase(),
          firstName: user.first_name,
          lastName: user.last_name,
        },
      });
    } catch {
      return res.status(503).json({ error: 'Unable to verify account' });
    }
  }

  return res.status(200).json({ success: true, user: sessionUser });
}
