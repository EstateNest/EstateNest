import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createSupabaseAuthClient, getManagementMfaContext, setAuthSessionCookies } from '../_lib/management-auth.js';
import { isTrustedOrigin } from '../_lib/session.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isTrustedOrigin(req)) {
    return res.status(403).json({ error: 'Invalid request origin' });
  }

  const context = await getManagementMfaContext(req, res);
  if (!context) return res.status(401).json({ message: 'Unable to verify the management account.' });

  const assurance = await context.client.auth.mfa.getAuthenticatorAssuranceLevel(context.session.access_token);
  if (assurance.error || assurance.data.currentLevel !== 'aal2') {
    return res.status(403).json({ message: 'Verify your authenticator before changing the password.' });
  }

  const { currentPassword, newPassword } = req.body || {};

  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return res.status(400).json({ message: 'Current and new passwords are required.' });
  }

  if (newPassword.length < 12) {
    return res.status(400).json({ message: 'The new password must be at least 12 characters.' });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({ message: 'Choose a new password that differs from the current password.' });
  }

  try {
    const verificationClient = createSupabaseAuthClient();
    const verified = await verificationClient.auth.signInWithPassword({
      email: context.user.email,
      password: currentPassword,
    });

    if (verified.error || !verified.data.session) {
      return res.status(403).json({ message: 'The current password is incorrect.' });
    }

    const updated = await context.client.auth.updateUser({ password: newPassword });

    if (updated.error) {
      return res.status(400).json({ message: 'Password update failed. Verify the password requirements and try again.' });
    }

    const refreshed = await context.client.auth.getSession();
    if (refreshed.data.session) setAuthSessionCookies(res, refreshed.data.session);
    return res.status(200).json({ success: true });
  } catch {
    return res.status(500).json({ message: 'Password update failed. Please try again.' });
  }
}
