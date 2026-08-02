import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getManagementMfaContext,
  sessionFromMfaVerification,
  setAuthSessionCookies,
} from '../_lib/management-auth.js';
import { isTrustedOrigin } from '../_lib/session.js';

function safeFactor(factor: { id: string; friendly_name?: string; status: string; created_at: string; updated_at: string }) {
  return {
    id: factor.id,
    friendlyName: factor.friendly_name || 'Authenticator app',
    status: factor.status,
    createdAt: factor.created_at,
    updatedAt: factor.updated_at,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (!['GET', 'POST'].includes(req.method || '')) {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  if (req.method === 'POST' && !isTrustedOrigin(req)) {
    return res.status(403).json({ message: 'Invalid request origin' });
  }

  const context = await getManagementMfaContext(req, res);
  if (!context) return res.status(401).json({ message: 'Sign in with your password before continuing.' });

  if (req.method === 'GET') {
    const [factors, assurance] = await Promise.all([
      context.client.auth.mfa.listFactors(),
      context.client.auth.mfa.getAuthenticatorAssuranceLevel(context.session.access_token),
    ]);
    if (factors.error || assurance.error) {
      return res.status(503).json({ message: 'MFA status is temporarily unavailable.' });
    }

    return res.status(200).json({
      success: true,
      currentLevel: assurance.data.currentLevel,
      nextLevel: assurance.data.nextLevel,
      factors: factors.data.all.map(safeFactor),
      totpEnrolled: factors.data.totp.length > 0,
      passkeyAvailable: false,
      passkeyStatus: 'Passkeys require a separate experimental Supabase configuration review.',
    });
  }

  const action = String(req.body?.action || '').toLowerCase();
  if (action === 'enroll') {
    const factors = await context.client.auth.mfa.listFactors();
    if (factors.error) return res.status(503).json({ message: 'Unable to prepare MFA enrollment.' });
    if (factors.data.totp.length) {
      return res.status(409).json({ message: 'A verified authenticator factor is already enrolled.' });
    }

    for (const factor of factors.data.all.filter((item) => item.factor_type === 'totp' && item.status !== 'verified')) {
      await context.client.auth.mfa.unenroll({ factorId: factor.id });
    }

    const enrolled = await context.client.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Estate Nest Management',
    });
    if (enrolled.error || enrolled.data.type !== 'totp') {
      return res.status(400).json({ message: 'Unable to start authenticator enrollment. Please try again.' });
    }

    return res.status(200).json({
      success: true,
      factorId: enrolled.data.id,
      qrCode: enrolled.data.totp.qr_code,
      secret: enrolled.data.totp.secret,
    });
  }

  if (action === 'verify' || action === 'confirm-enrollment') {
    const code = String(req.body?.code || '').replace(/\s/g, '');
    const requestedFactorId = String(req.body?.factorId || '').trim();
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ message: 'Enter the six-digit code from your authenticator app.' });
    }

    const factors = await context.client.auth.mfa.listFactors();
    if (factors.error) return res.status(503).json({ message: 'Unable to verify the authenticator factor.' });
    const eligible = action === 'verify'
      ? factors.data.totp
      : factors.data.all.filter((factor) => factor.factor_type === 'totp');
    const factor = eligible.find((item) => item.id === requestedFactorId) || eligible[0];
    if (!factor) return res.status(400).json({ message: 'No authenticator factor is available.' });

    const verified = await context.client.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
    if (verified.error) {
      return res.status(401).json({ message: 'The authenticator code is invalid or expired. Try the current code.' });
    }

    setAuthSessionCookies(res, sessionFromMfaVerification(verified.data));
    return res.status(200).json({ success: true });
  }

  if (action === 'unenroll') {
    const assurance = await context.client.auth.mfa.getAuthenticatorAssuranceLevel(context.session.access_token);
    if (assurance.error || assurance.data.currentLevel !== 'aal2') {
      return res.status(403).json({ message: 'Verify MFA before removing an authenticator factor.' });
    }
    const factorId = String(req.body?.factorId || '').trim();
    if (!factorId) return res.status(400).json({ message: 'Factor id is required.' });
    const result = await context.client.auth.mfa.unenroll({ factorId });
    if (result.error) return res.status(400).json({ message: 'Unable to remove the authenticator factor.' });
    return res.status(200).json({ success: true });
  }

  return res.status(400).json({ message: 'Unsupported MFA action.' });
}
