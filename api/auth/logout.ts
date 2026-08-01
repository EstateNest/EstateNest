import type { VercelRequest, VercelResponse } from '@vercel/node';
import { clearAuthSessionCookies, signOutManagementUser } from '../_lib/management-auth.js';
import { isTrustedOrigin } from '../_lib/session.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isTrustedOrigin(req)) {
    return res.status(403).json({ error: 'Invalid request origin' });
  }

  await signOutManagementUser(req);
  clearAuthSessionCookies(res);

  return res.status(200).json({ success: true });
}
