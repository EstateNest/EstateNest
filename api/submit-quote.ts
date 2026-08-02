import { createHash } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  CHATBOT_HANDOFF_COOKIE,
  clearPrivateCookie,
  hashOpaqueToken,
  readCookie,
} from './_lib/chatbot-security.js';
import { getLeadNotificationRecipients, sendGmailMessage } from './_lib/gmail.js';
import { isTrustedOrigin } from './_lib/session.js';
import { getSupabaseAdmin } from './_lib/supabase.js';

interface QuoteFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  province: string;
  smokingHistory: string;
  medicalHistory: string;
  medicalCondition?: string;
  medicineName?: string;
  dosage?: string;
  insuranceAmount: string;
  insuranceType: string;
  readyToProceed: string;
  website?: string;
}

interface ValidationError {
  field: string;
  message: string;
}

interface AcceptedQuote {
  lead_id: string;
  lead_public_id: string;
  notification_id: string | null;
  duplicate: boolean;
  accepted_at: string;
}

const ALLOWED_PROVINCES = new Set(['AB', 'ON']);
const YES_NO = new Set(['yes', 'no']);

function normalizedText(value: unknown, maximum: number): string {
  return String(value || '').trim().slice(0, maximum);
}

function validateFormData(data: QuoteFormData): ValidationError[] {
  const errors: ValidationError[] = [];
  const required: Array<[keyof QuoteFormData, string]> = [
    ['firstName', 'First name'],
    ['lastName', 'Last name'],
    ['email', 'Email'],
    ['phone', 'Phone'],
    ['province', 'Province'],
    ['insuranceType', 'Insurance type'],
    ['insuranceAmount', 'Coverage amount'],
    ['readyToProceed', 'Readiness selection'],
    ['smokingHistory', 'Smoking-history selection'],
    ['medicalHistory', 'Medical-history selection'],
  ];

  required.forEach(([field, label]) => {
    if (!normalizedText(data[field], 500)) errors.push({ field, message: `${label} is required` });
  });

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' });
  }

  if ((data.phone || '').replace(/\D/g, '').length < 10) {
    errors.push({ field: 'phone', message: 'Please enter a valid 10-digit phone number' });
  }

  if (data.province && !ALLOWED_PROVINCES.has(data.province.trim().toUpperCase())) {
    errors.push({ field: 'province', message: 'Estate Nest currently accepts online quote requests from Alberta and Ontario' });
  }

  if (data.readyToProceed && !YES_NO.has(data.readyToProceed)) {
    errors.push({ field: 'readyToProceed', message: 'Select a valid readiness option' });
  }
  if (data.smokingHistory && !YES_NO.has(data.smokingHistory)) {
    errors.push({ field: 'smokingHistory', message: 'Select a valid smoking-history option' });
  }
  if (data.medicalHistory && !YES_NO.has(data.medicalHistory)) {
    errors.push({ field: 'medicalHistory', message: 'Select a valid medical-history option' });
  }

  return errors;
}

function escapeHtml(value: unknown): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function mapInsuranceInterest(insuranceType: string): string {
  const normalized = insuranceType.toLowerCase();
  if (normalized.includes('critical')) return 'CRITICAL_ILLNESS';
  if (normalized.includes('disability')) return 'DISABILITY';
  if (normalized.includes('travel')) return 'TRAVEL';
  if (normalized.includes('mortgage')) return 'MORTGAGE_PROTECTION';
  if (normalized.includes('segregated')) return 'SEGREGATED_FUNDS';
  if (normalized.includes('group') || normalized.includes('buy-sell') || normalized.includes('business')) return 'BUSINESS';
  if (normalized.includes('final expense')) return 'WHOLE_LIFE';
  if (normalized.includes('life')) return 'TERM_LIFE';
  return 'OTHER';
}

function requestValue(req: VercelRequest, header: string): string {
  const value = req.headers[header];
  return (Array.isArray(value) ? value[0] : value || '').slice(0, 1000);
}

function quoteDedupeKey(data: QuoteFormData, interest: string, handoffHash = ''): string {
  const dateBucket = new Date().toISOString().slice(0, 10);
  const email = data.email.trim().toLowerCase();
  const phone = data.phone.replace(/\D/g, '');
  return createHash('sha256').update(`${email}|${phone}|${interest}|${dateBucket}|${handoffHash}`).digest('hex');
}

function secureCrmBaseUrl(): string {
  const configured = process.env.PUBLIC_SITE_URL?.trim();
  if (configured && /^https:\/\//i.test(configured)) return configured.replace(/\/$/, '');
  return 'https://www.estatenest.ca';
}

function notificationContent(data: QuoteFormData, accepted: AcceptedQuote, interest: string) {
  const submittedAt = new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'full',
    timeStyle: 'long',
    timeZone: 'America/Edmonton',
  }).format(new Date(accepted.accepted_at));
  const crmLink = `${secureCrmBaseUrl()}/management/leads/${encodeURIComponent(accepted.lead_id)}`;
  const name = `${data.firstName.trim()} ${data.lastName.trim()}`;
  const source = 'estatenest.ca/quote';
  const fields = [
    ['Lead ID', accepted.lead_public_id],
    ['Name', name],
    ['Email', data.email.trim().toLowerCase()],
    ['Phone', data.phone.trim()],
    ['Province', data.province.trim().toUpperCase()],
    ['Insurance interest', data.insuranceType.trim()],
    ['Source', source],
    ['Submitted', `${submittedAt} (Mountain Time)`],
  ];

  const rows = fields.map(([label, value]) => `
    <tr><th align="left" style="padding:8px;border-bottom:1px solid #dbeafe;color:#1e3a5f">${escapeHtml(label)}</th>
    <td style="padding:8px;border-bottom:1px solid #dbeafe">${escapeHtml(value)}</td></tr>`).join('');

  return {
    subject: `New Estate Nest quote lead ${accepted.lead_public_id} — ${name}`,
    html: `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#172033;background:#f8fafc;padding:24px">
      <div style="max-width:640px;margin:auto;background:white;border:1px solid #dbeafe;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#075985,#0891b2);color:white;padding:24px"><h1 style="font-size:22px;margin:0">New quote lead accepted</h1><p style="margin:8px 0 0">${escapeHtml(accepted.lead_public_id)}</p></div>
        <div style="padding:24px"><table style="width:100%;border-collapse:collapse">${rows}</table>
        <p style="margin:24px 0 0"><a href="${escapeHtml(crmLink)}" style="display:inline-block;background:#ea6a47;color:white;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:bold">Open secure CRM record</a></p>
        <p style="font-size:12px;color:#64748b;margin-top:20px">Health, medication, underwriting, and coverage-amount details are intentionally excluded from this notification. Sign in to the protected management portal for the approved record.</p></div>
      </div></body></html>`,
    text: [
      'New Estate Nest quote lead accepted',
      ...fields.map(([label, value]) => `${label}: ${value}`),
      `Secure CRM record: ${crmLink}`,
      `Normalized interest: ${interest}`,
      'Sensitive health, medication, underwriting, and coverage-amount details are intentionally excluded.',
    ].join('\n'),
  };
}

async function recordNotificationResult(notificationId: string, result: Awaited<ReturnType<typeof sendGmailMessage>>) {
  const now = new Date().toISOString();
  const updates = result.success
    ? {
        status: 'SENT',
        provider_message_id: result.messageId || null,
        attempt_count: 1,
        last_attempt_at: now,
        sent_at: now,
        last_error_code: null,
        last_error_message: null,
        failed_at: null,
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
  if (error) console.error('Quote notification status update failed');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed. Please use POST to submit the form.' });
  }

  if (!isTrustedOrigin(req)) {
    return res.status(403).json({ success: false, message: 'Invalid request origin.' });
  }

  const data = (req.body || {}) as Partial<QuoteFormData>;
  if (normalizedText(data.website, 200)) {
    return res.status(400).json({ success: false, message: 'Unable to accept this request.' });
  }
  const sanitized: QuoteFormData = {
    firstName: normalizedText(data.firstName, 100),
    lastName: normalizedText(data.lastName, 100),
    email: normalizedText(data.email, 255).toLowerCase(),
    phone: normalizedText(data.phone, 50),
    province: normalizedText(data.province, 10).toUpperCase(),
    smokingHistory: normalizedText(data.smokingHistory, 10).toLowerCase(),
    medicalHistory: normalizedText(data.medicalHistory, 10).toLowerCase(),
    medicalCondition: normalizedText(data.medicalCondition, 500),
    medicineName: normalizedText(data.medicineName, 255),
    dosage: normalizedText(data.dosage, 100),
    insuranceAmount: normalizedText(data.insuranceAmount, 100),
    insuranceType: normalizedText(data.insuranceType, 255),
    readyToProceed: normalizedText(data.readyToProceed, 10).toLowerCase(),
  };
  const validationErrors = validateFormData(sanitized);
  if (validationErrors.length) {
    return res.status(400).json({ success: false, errors: validationErrors, message: 'Please correct the form errors' });
  }

  const insuranceInterest = mapInsuranceInterest(sanitized.insuranceType);
  const recipients = getLeadNotificationRecipients();
  const forwardedFor = requestValue(req, 'x-forwarded-for');
  const ipAddress = forwardedFor.split(',')[0]?.trim().slice(0, 45) || null;
  const handoffToken = readCookie(req, CHATBOT_HANDOFF_COOKIE);
  const handoffHash = handoffToken ? hashOpaqueToken(handoffToken) : '';
  const submissionKey = quoteDedupeKey(sanitized, insuranceInterest, handoffHash);

  try {
    const commonParameters = {
      p_first_name: sanitized.firstName,
      p_last_name: sanitized.lastName,
      p_email: sanitized.email,
      p_phone: sanitized.phone,
      p_province: sanitized.province,
      p_insurance_interest: insuranceInterest,
      p_insurance_type: sanitized.insuranceType,
      p_insurance_amount: sanitized.insuranceAmount || '',
      p_ready_to_proceed: sanitized.readyToProceed,
      p_smoking_disclosed: sanitized.smokingHistory === 'yes',
      p_medical_disclosed: sanitized.medicalHistory === 'yes',
      p_referring_url: requestValue(req, 'referer') || null,
      p_ip_address: ipAddress,
      p_user_agent: requestValue(req, 'user-agent'),
      p_notification_recipients: recipients,
    };
    const { data: acceptedData, error } = handoffHash
      ? await getSupabaseAdmin().rpc('accept_chatbot_quote_lead', {
          p_handoff_token_hash: handoffHash,
          p_submission_key: submissionKey,
          ...commonParameters,
        })
      : await getSupabaseAdmin().rpc('accept_quote_lead', {
          p_dedupe_key: submissionKey,
          ...commonParameters,
        });

    const accepted = (Array.isArray(acceptedData) ? acceptedData[0] : acceptedData) as AcceptedQuote | null;
    if (error || !accepted?.lead_id || !accepted.lead_public_id) {
      if (handoffToken && String(error?.message || '').includes('chatbot_')) {
        clearPrivateCookie(res, CHATBOT_HANDOFF_COOKIE);
        return res.status(410).json({
          success: false,
          message: 'The secure chatbot handoff expired before submission. Please restart the chat or contact Estate Nest so we can preserve the correct prospect record.',
        });
      }
      console.error('Quote acceptance transaction failed', {
        code: String(error?.code || 'UNCLASSIFIED').slice(0, 80),
        message: String(error?.message || '').slice(0, 240),
      });
      return res.status(503).json({
        success: false,
        message: 'We could not securely accept the quote request. Please try again or contact hello@estatenest.ca.',
      });
    }

    if (!accepted.duplicate && accepted.notification_id) {
      const content = notificationContent(sanitized, accepted, insuranceInterest);
      const emailResult = await sendGmailMessage({
        to: recipients,
        subject: content.subject,
        html: content.html,
        text: content.text,
        replyTo: sanitized.email,
      });
      await recordNotificationResult(accepted.notification_id, emailResult);
    }

    if (handoffToken) clearPrivateCookie(res, CHATBOT_HANDOFF_COOKIE);

    return res.status(200).json({
      success: true,
      accepted: true,
      leadReference: accepted.lead_public_id,
      duplicate: accepted.duplicate,
      chatbotLinked: Boolean(handoffToken),
      message: 'Your quote request has been securely accepted. A licensed advisor will follow up as soon as reasonably possible, generally within one business day.',
    });
  } catch {
    console.error('Quote acceptance service unavailable');
    return res.status(503).json({
      success: false,
      message: 'We could not securely accept the quote request. Please try again or contact hello@estatenest.ca.',
    });
  }
}
