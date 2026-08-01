import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { getSessionUser, isTrustedOrigin } from '../_lib/session.js';
import { getSupabaseAdmin } from '../_lib/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isTrustedOrigin(req)) {
    return res.status(403).json({ error: 'Invalid request origin' });
  }

  const sessionUser = getSessionUser(req);
  if (!sessionUser) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (sessionUser.id === 'environment-admin') {
    return res.status(409).json({ message: 'This password is managed through encrypted Vercel environment variables.' });
  }

  const { currentPassword, newPassword } = req.body || {};
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return res.status(400).json({ message: 'Current and new passwords are required.' });
  }

  if (newPassword.length < 12) {
    return res.status(400).json({ message: 'The new password must be at least 12 characters.' });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, password_hash, is_active')
      .eq('id', sessionUser.id)
      .maybeSingle();

    if (userError || !user?.is_active || !user.password_hash) {
      return res.status(401).json({ message: 'Unable to verify the management account.' });
    }

    if (!await bcrypt.compare(currentPassword, user.password_hash)) {
      return res.status(403).json({ message: 'The current password is incorrect.' });
    }

    if (await bcrypt.compare(newPassword, user.password_hash)) {
      return res.status(400).json({ message: 'Choose a new password that differs from the current password.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', sessionUser.id);

    if (updateError) {
      throw updateError;
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Password update failed:', error instanceof Error ? error.message : 'Unknown error');
    return res.status(500).json({ message: 'Password update failed. Please try again.' });
  }
}
