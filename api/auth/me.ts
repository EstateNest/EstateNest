import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getManagementAuth } from '../_lib/management-auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await getManagementAuth(req, res);

  if (auth.status === 'unauthenticated') {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (auth.status === 'unauthorized') {
    return res.status(403).json({ error: 'Management access is not authorized' });
  }

  if (auth.status === 'mfa_required' || auth.status === 'mfa_enrollment_required') {
    return res.status(401).json({
      error: 'Additional authentication is required',
      code: auth.status === 'mfa_required' ? 'MFA_REQUIRED' : 'MFA_ENROLLMENT_REQUIRED',
    });
  }

  if (auth.status !== 'authorized' || !auth.user) {
    return res.status(503).json({ error: 'Unable to verify account' });
  }

  return res.status(200).json({ success: true, user: auth.user });
}
