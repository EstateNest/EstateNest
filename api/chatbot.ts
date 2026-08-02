import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  CHATBOT_CONTENT_VERSION,
  CHATBOT_ENQUIRY_CONSENT,
  CHATBOT_MARKETING_CONSENT,
  chatbotProducts,
  type ChatbotProductCode,
} from '../src/content/chatbotContent.js';
import {
  CHATBOT_HANDOFF_COOKIE,
  CHATBOT_SESSION_COOKIE,
  chatbotHandoffSeconds,
  chatbotRetentionDays,
  clearPrivateCookie,
  hashOpaqueToken,
  randomOpaqueToken,
  readCookie,
  requestFingerprint,
  safeReferrer,
  safeSourcePage,
  safeUtm,
  setPrivateCookie,
  validateContactInput,
} from './_lib/chatbot-security.js';
import { getLeadNotificationRecipients, sendGmailMessage } from './_lib/gmail.js';
import { getRequestIp, isTrustedOrigin } from './_lib/session.js';
import { getSupabaseAdmin } from './_lib/supabase.js';

interface AcceptedProspect {
  lead_id: string;
  lead_public_id: string;
  notification_id: string | null;
  duplicate: boolean;
  accepted_at: string;
}

interface HandoffPrefill {
  lead_id: string;
  lead_public_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  province: string | null;
  interests: ChatbotProductCode[];
}

const productByCode = new Map(chatbotProducts.map((product) => [product.code, product]));

function bodySizeIsSafe(req: VercelRequest): boolean {
  try {
    return JSON.stringify(req.body || {}).length <= 12_000;
  } catch {
    return false;
  }
}

function requestAction(req: VercelRequest): string {
  const queryAction = Array.isArray(req.query.action) ? req.query.action[0] : req.query.action;
  return String(queryAction || req.body?.action || '').trim().toLowerCase().slice(0, 50);
}

function secureCrmBaseUrl(): string {
  const configured = process.env.PUBLIC_SITE_URL?.trim();
  if (configured && /^https:\/\//i.test(configured)) return configured.replace(/\/$/, '');
  const previewHost = process.env.VERCEL_URL?.trim();
  if (process.env.VERCEL_ENV === 'preview' && previewHost) {
    return `https://${previewHost.replace(/^https?:\/\//i, '').replace(/\/$/, '')}`;
  }
  return 'https://www.estatenest.ca';
}

function escapeHtml(value: unknown): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function prospectNotificationContent(
  contact: { fullName: string; email: string; phone: string },
  accepted: AcceptedProspect,
  sourcePage: string,
  interest?: string,
) {
  const submittedAt = new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'full',
    timeStyle: 'long',
    timeZone: 'America/Edmonton',
  }).format(new Date(accepted.accepted_at));
  const crmLink = `${secureCrmBaseUrl()}/management/leads/${encodeURIComponent(accepted.lead_id)}`;
  const fields = [
    ['Prospect ID', accepted.lead_public_id],
    ['Name', contact.fullName],
    ['Email', contact.email],
    ['Phone', contact.phone],
    ...(interest ? [['Insurance interest', interest]] : []),
    ['Source page', sourcePage],
    ['Submitted', `${submittedAt} (Mountain Time)`],
  ];
  const rows = fields.map(([label, value]) => `
    <tr><th align="left" style="padding:8px;border-bottom:1px solid #dbeafe;color:#1e3a5f">${escapeHtml(label)}</th>
    <td style="padding:8px;border-bottom:1px solid #dbeafe">${escapeHtml(value)}</td></tr>`).join('');

  return {
    subject: `New Chatbot Prospect ${accepted.lead_public_id} — ${contact.fullName}`,
    html: `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#172033;background:#f8fafc;padding:24px">
      <div style="max-width:640px;margin:auto;background:white;border:1px solid #dbeafe;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#075985,#0891b2);color:white;padding:24px"><h1 style="font-size:22px;margin:0">New Chatbot Prospect</h1><p style="margin:8px 0 0">${escapeHtml(accepted.lead_public_id)}</p></div>
        <div style="padding:24px"><table style="width:100%;border-collapse:collapse">${rows}</table>
        <p style="margin:24px 0 0"><a href="${escapeHtml(crmLink)}" style="display:inline-block;background:#ea6a47;color:white;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:bold">Open secure CRM record</a></p>
        <p style="font-size:12px;color:#64748b;margin-top:20px">No raw chat, medical, banking, identification, or other sensitive content is included. Sign in to the protected management portal to review the approved record.</p></div>
      </div></body></html>`,
    text: [
      'New Chatbot Prospect',
      ...fields.map(([label, value]) => `${label}: ${value}`),
      `Secure CRM record: ${crmLink}`,
      'No raw chat or sensitive content is included.',
    ].join('\n'),
  };
}

async function updateNotificationStatus(
  notificationId: string,
  result: Awaited<ReturnType<typeof sendGmailMessage>>,
): Promise<'SENT' | 'FAILED'> {
  const now = new Date().toISOString();
  const updates = result.success
    ? {
        status: 'SENT',
        provider_message_id: result.messageId || null,
        attempt_count: 1,
        last_attempt_at: now,
        sent_at: now,
        failed_at: null,
        last_error_code: null,
        last_error_message: null,
        next_retry_at: null,
      }
    : {
        status: 'FAILED',
        attempt_count: 1,
        last_attempt_at: now,
        failed_at: now,
        last_error_code: result.errorCode || 'SMTP_ERROR',
        last_error_message: result.errorMessage || 'Gmail SMTP rejected the message.',
        next_retry_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      };
  const { error } = await getSupabaseAdmin().from('quote_notifications').update(updates).eq('id', notificationId);
  if (error) console.error('Chatbot notification status update failed');
  return result.success ? 'SENT' : 'FAILED';
}

function publicError(res: VercelResponse, error: unknown) {
  const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : '';
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code).slice(0, 80) : 'UNCLASSIFIED';
  if (message.includes('chatbot_rate_limited')) {
    return res.status(429).json({ success: false, message: 'Please wait before starting another chat or contact Estate Nest directly.' });
  }
  if (message.includes('chatbot_contact_conflict')) {
    return res.status(409).json({ success: false, message: 'We could not safely match these contact details. Please call 780-860-3191 or email hello@estatenest.ca.' });
  }
  if (message.includes('chatbot_handoff_invalid')) {
    return res.status(410).json({ success: false, message: 'This secure quote handoff has expired. Please restart the chat or complete the quote form manually.' });
  }
  if (message.includes('chatbot_session_invalid')) {
    return res.status(409).json({ success: false, message: 'This chat session is no longer available. Please restart the conversation.' });
  }
  console.error('Chatbot request failed', { code, message: message.slice(0, 240) });
  return res.status(503).json({ success: false, message: 'The secure chat service is temporarily unavailable. Please call or email Estate Nest.' });
}

async function handleHandoffRead(req: VercelRequest, res: VercelResponse) {
  const token = readCookie(req, CHATBOT_HANDOFF_COOKIE);
  if (!token) return res.status(404).json({ success: false, message: 'No secure chatbot handoff is available.' });

  const { data, error } = await getSupabaseAdmin().rpc('read_chatbot_quote_handoff', {
    p_handoff_token_hash: hashOpaqueToken(token),
  });
  const handoff = (Array.isArray(data) ? data[0] : data) as HandoffPrefill | null;
  if (error || !handoff?.lead_id) {
    clearPrivateCookie(res, CHATBOT_HANDOFF_COOKIE);
    return publicError(res, error || new Error('chatbot_handoff_invalid'));
  }

  const selectedProduct = handoff.interests
    .map((code) => productByCode.get(code))
    .find(Boolean);
  return res.status(200).json({
    success: true,
    prefill: {
      firstName: handoff.first_name || '',
      lastName: handoff.last_name || '',
      email: handoff.email || '',
      phone: handoff.phone || '',
      province: handoff.province || '',
      insuranceType: selectedProduct?.quoteValue || '',
    },
    leadReference: handoff.lead_public_id,
  });
}

async function handleStart(req: VercelRequest, res: VercelResponse) {
  const token = randomOpaqueToken();
  const { ipHash, userAgentHash } = requestFingerprint(req, getRequestIp(req));
  const sourcePage = safeSourcePage(req.body?.sourcePage);
  const referrer = safeReferrer(req.body?.referrer || req.headers.referer);
  const marketingStatus = req.body?.marketingConsent === true ? 'GRANTED' : 'DECLINED';
  const { data, error } = await getSupabaseAdmin().rpc('start_chatbot_session', {
    p_session_token_hash: hashOpaqueToken(token),
    p_source_page: sourcePage,
    p_referrer: referrer,
    p_utm_parameters: safeUtm(req.body?.utm),
    p_ip_hash: ipHash,
    p_user_agent_hash: userAgentHash,
    p_retention_days: chatbotRetentionDays(),
    p_enquiry_version: `${CHATBOT_CONTENT_VERSION}.enquiry`,
    p_enquiry_wording: CHATBOT_ENQUIRY_CONSENT,
    p_marketing_status: marketingStatus,
    p_marketing_version: `${CHATBOT_CONTENT_VERSION}.marketing`,
    p_marketing_wording: CHATBOT_MARKETING_CONSENT,
  });
  const session = Array.isArray(data) ? data[0] : data;
  if (error || !session?.session_public_id) return publicError(res, error);
  setPrivateCookie(res, CHATBOT_SESSION_COOKIE, token, 24 * 60 * 60);
  return res.status(201).json({
    success: true,
    sessionId: session.session_public_id,
    status: session.session_status,
    consentVersion: CHATBOT_CONTENT_VERSION,
  });
}

async function handleContactConfirmation(req: VercelRequest, res: VercelResponse, sessionToken: string) {
  const validation = validateContactInput(req.body);
  if (!validation.contact) {
    return res.status(400).json({
      success: false,
      field: validation.field,
      sensitive: validation.sensitive || false,
      message: validation.message || 'Please correct the contact details.',
    });
  }
  const recipients = getLeadNotificationRecipients();
  const sessionHash = hashOpaqueToken(sessionToken);
  const { data, error } = await getSupabaseAdmin().rpc('accept_chatbot_prospect', {
    p_session_token_hash: sessionHash,
    p_first_name: validation.contact.firstName,
    p_last_name: validation.contact.lastName,
    p_email: validation.contact.email,
    p_phone: validation.contact.phone,
    p_notification_recipients: recipients,
  });
  const accepted = (Array.isArray(data) ? data[0] : data) as AcceptedProspect | null;
  if (error || !accepted?.lead_id || !accepted.lead_public_id) return publicError(res, error);

  let notificationStatus: 'SENT' | 'FAILED' | 'UNCHANGED' = 'UNCHANGED';
  if (!accepted.duplicate && accepted.notification_id) {
    const { data: session } = await getSupabaseAdmin()
      .from('chatbot_sessions')
      .select('source_page, interests')
      .eq('session_token_hash', sessionHash)
      .maybeSingle();
    const interest = Array.isArray(session?.interests)
      ? session.interests.map((code) => productByCode.get(code as ChatbotProductCode)?.label).filter(Boolean).join(', ')
      : '';
    const content = prospectNotificationContent(
      validation.contact,
      accepted,
      String(session?.source_page || '/'),
      interest || undefined,
    );
    const result = await sendGmailMessage({
      to: recipients,
      subject: content.subject,
      html: content.html,
      text: content.text,
      replyTo: validation.contact.email,
    });
    notificationStatus = await updateNotificationStatus(accepted.notification_id, result);
  }

  return res.status(201).json({
    success: true,
    accepted: true,
    prospectReference: accepted.lead_public_id,
    duplicate: accepted.duplicate,
    notificationStatus,
  });
}

async function handleInterests(req: VercelRequest, res: VercelResponse, sessionToken: string) {
  const requested = Array.isArray(req.body?.interests) ? req.body.interests.map(String) : [];
  const interests = Array.from(new Set(requested)).filter((code): code is ChatbotProductCode => productByCode.has(code as ChatbotProductCode));
  if (!interests.length || interests.length !== requested.length || (interests.includes('NOT_SURE') && interests.length > 1)) {
    return res.status(400).json({ success: false, message: 'Select one or more valid interests. “Not Sure Yet” must be selected by itself.' });
  }
  const primary = productByCode.get(interests[0]);
  const { data, error } = await getSupabaseAdmin().rpc('update_chatbot_interests', {
    p_session_token_hash: hashOpaqueToken(sessionToken),
    p_interests: interests,
    p_primary_interest: primary?.crmInterest || 'OTHER',
  });
  if (error || !data) return publicError(res, error);
  return res.status(200).json({ success: true, interests });
}

async function handleHandoffCreate(req: VercelRequest, res: VercelResponse, sessionToken: string) {
  const token = randomOpaqueToken();
  const maxAge = chatbotHandoffSeconds();
  const { data, error } = await getSupabaseAdmin().rpc('create_chatbot_quote_handoff', {
    p_session_token_hash: hashOpaqueToken(sessionToken),
    p_handoff_token_hash: hashOpaqueToken(token),
    p_expires_seconds: maxAge,
  });
  if (error || !data) return publicError(res, error);
  setPrivateCookie(res, CHATBOT_HANDOFF_COOKIE, token, maxAge);
  return res.status(201).json({ success: true, destination: '/quote', expiresIn: maxAge });
}

async function handleOutcome(req: VercelRequest, res: VercelResponse, sessionToken: string, status: string) {
  const { error } = await getSupabaseAdmin().rpc('set_chatbot_session_outcome', {
    p_session_token_hash: hashOpaqueToken(sessionToken),
    p_status: status,
  });
  if (error) return publicError(res, error);
  return res.status(200).json({ success: true, status });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');

  try {
    const action = requestAction(req);
    if (req.method === 'GET') {
      if (action !== 'handoff') return res.status(404).json({ success: false, message: 'Chatbot route not found.' });
      return await handleHandoffRead(req, res);
    }
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed.' });
    if (!isTrustedOrigin(req)) return res.status(403).json({ success: false, message: 'Invalid request origin.' });
    if (!bodySizeIsSafe(req) || String(req.body?.website || '').trim()) {
      return res.status(400).json({ success: false, message: 'Unable to accept this request.' });
    }
    if (action === 'start') return await handleStart(req, res);

    const sessionToken = readCookie(req, CHATBOT_SESSION_COOKIE);
    if (!sessionToken) return res.status(409).json({ success: false, message: 'Please restart the conversation.' });
    if (action === 'confirm-contact') return await handleContactConfirmation(req, res, sessionToken);
    if (action === 'interests') return await handleInterests(req, res, sessionToken);
    if (action === 'handoff') return await handleHandoffCreate(req, res, sessionToken);
    if (action === 'follow-up') return await handleOutcome(req, res, sessionToken, 'FOLLOW_UP_REQUESTED');
    if (action === 'end') return await handleOutcome(req, res, sessionToken, 'ENDED');
    if (action === 'abandon') return await handleOutcome(req, res, sessionToken, 'ABANDONED');
    return res.status(404).json({ success: false, message: 'Chatbot route not found.' });
  } catch (error) {
    return publicError(res, error);
  }
}
