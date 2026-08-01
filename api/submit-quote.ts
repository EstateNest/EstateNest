import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createTransport } from 'nodemailer';
import { getSupabaseAdmin } from './_lib/supabase.js';

interface QuoteFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  smokingHistory: string;
  medicalHistory: string;
  medicalCondition?: string;
  medicineName?: string;
  dosage?: string;
  insuranceAmount?: string;
  insuranceType: string;
  readyToProceed: string;
}

interface ValidationError {
  field: string;
  message: string;
}

const DEFAULT_NOTIFICATION_RECIPIENTS = ['hello@estatenest.ca', 'kanwar@estatenest.ca'];

function getNotificationRecipients(): string[] {
  const configuredRecipients = [
    process.env.LEAD_NOTIFICATION_EMAIL_1,
    process.env.LEAD_NOTIFICATION_EMAIL_2,
  ]
    .map((email) => email?.trim())
    .filter((email): email is string => Boolean(email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)));

  return configuredRecipients.length > 0
    ? Array.from(new Set(configuredRecipients))
    : DEFAULT_NOTIFICATION_RECIPIENTS;
}

function validateFormData(data: QuoteFormData): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.firstName?.trim()) {
    errors.push({ field: 'firstName', message: 'First name is required' });
  }
  if (!data.lastName?.trim()) {
    errors.push({ field: 'lastName', message: 'Last name is required' });
  }
  if (!data.email?.trim()) {
    errors.push({ field: 'email', message: 'Email is required' });
  }
  if (!data.phone?.trim()) {
    errors.push({ field: 'phone', message: 'Phone is required' });
  }
  if (!data.insuranceType?.trim()) {
    errors.push({ field: 'insuranceType', message: 'Insurance type is required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (data.email && !emailRegex.test(data.email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' });
  }

  const cleanPhone = data.phone?.replace(/\D/g, '') || '';
  if (cleanPhone.length < 10) {
    errors.push({ field: 'phone', message: 'Please enter a valid 10-digit phone number' });
  }

  return errors;
}

function escapeHtml(value: string | undefined): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateEmailHtml(input: QuoteFormData, timestamp: string, cleanPhone: string): string {
  const data = Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, typeof value === 'string' ? escapeHtml(value) : value]),
  ) as unknown as QuoteFormData;

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1e3a5f, #2d5a87); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
    .field { margin-bottom: 12px; padding: 10px; background: white; border-radius: 4px; }
    .label { font-weight: bold; color: #1e3a5f; }
    .value { margin-top: 4px; }
    .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
    .urgent { background: #fff3cd; padding: 10px; border-radius: 4px; border-left: 4px solid #ffc107; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin:0;">🏠 New Quote Request - Estate Nest</h2>
      <p style="margin:5px 0 0 0;">${timestamp} (Mountain Time)</p>
    </div>
    <div class="content">
      <div class="urgent">
        <strong>⚡ Action Required:</strong> New insurance inquiry - respond within 24 hours
      </div>
      
      <h3 style="margin-top:20px; color:#1e3a5f;">Customer Information</h3>
      <div class="field">
        <div class="label">Name</div>
        <div class="value">${data.firstName} ${data.lastName}</div>
      </div>
      <div class="field">
        <div class="label">Email</div>
        <div class="value"><a href="mailto:${data.email}">${data.email}</a></div>
      </div>
      <div class="field">
        <div class="label">Phone</div>
        <div class="value"><a href="tel:${cleanPhone}">${data.phone}</a></div>
      </div>

      <h3 style="margin-top:20px; color:#1e3a5f;">Insurance Details</h3>
      <div class="field">
        <div class="label">Type of Insurance</div>
        <div class="value">${data.insuranceType}</div>
      </div>
      <div class="field">
        <div class="label">Coverage Amount</div>
        <div class="value">${data.insuranceAmount || 'Not specified'}</div>
      </div>
      <div class="field">
        <div class="label">Ready to Proceed</div>
        <div class="value">${data.readyToProceed === 'yes' ? '✅ Yes - Ready to proceed' : '❓ Needs more information'}</div>
      </div>

      <h3 style="margin-top:20px; color:#1e3a5f;">Health Information</h3>
      <div class="field">
        <div class="label">Smoking History</div>
        <div class="value">${data.smokingHistory === 'yes' ? '🚬 Yes' : '❌ No'}</div>
      </div>
      <div class="field">
        <div class="label">Medical History</div>
        <div class="value">${data.medicalHistory === 'yes' ? '⚠️ Has medical conditions' : '✅ No medical conditions'}</div>
      </div>
      ${data.medicalHistory === 'yes' ? `
      <div class="field">
        <div class="label">Medical Condition</div>
        <div class="value">${data.medicalCondition || 'Not specified'}</div>
      </div>
      <div class="field">
        <div class="label">Medicine</div>
        <div class="value">${data.medicineName || 'Not specified'} ${data.dosage ? `(${data.dosage})` : ''}</div>
      </div>
      ` : ''}

      <div class="footer">
        <p><strong>Source:</strong> estatenest.ca/quote</p>
        <p><strong>IP Address:</strong> Received via secure serverless function</p>
        <p style="margin-top:10px;">This email was automatically generated from the Estate Nest website quote request form.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;
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

async function saveQuoteToCrm(data: QuoteFormData, req: VercelRequest): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();
    const email = data.email.trim().toLowerCase();
    const existingContact = await supabase
      .from('contacts')
      .select('id')
      .ilike('email', email)
      .maybeSingle();
    let contactId = existingContact.data?.id;

    if (contactId) {
      const { error } = await supabase
        .from('contacts')
        .update({
          first_name: data.firstName.trim().slice(0, 100),
          last_name: data.lastName.trim().slice(0, 100),
          phone: data.phone.trim().slice(0, 50),
        })
        .eq('id', contactId);
      if (error) throw error;
    } else {
      const { data: contact, error } = await supabase
        .from('contacts')
        .insert({
          first_name: data.firstName.trim().slice(0, 100),
          last_name: data.lastName.trim().slice(0, 100),
          email,
          phone: data.phone.trim().slice(0, 50),
          preferred_contact_method: 'EITHER',
          marketing_consent: false,
        })
        .select('id')
        .single();
      if (error) throw error;
      contactId = contact.id;
    }

    const notes = [
      `Quote request for ${data.insuranceType}`,
      data.insuranceAmount ? `Requested coverage: ${data.insuranceAmount}` : null,
      `Ready to proceed: ${data.readyToProceed === 'yes' ? 'Yes' : 'Needs more information'}`,
      `Smoking history disclosed: ${data.smokingHistory === 'yes' ? 'Yes' : 'No'}`,
      `Medical history disclosed: ${data.medicalHistory === 'yes' ? 'Yes - review securely with the prospect' : 'No'}`,
    ].filter(Boolean).join('\n');
    const insuranceInterest = mapInsuranceInterest(data.insuranceType);
    const funnelType = ['TERM_LIFE', 'MORTGAGE_PROTECTION', 'CRITICAL_ILLNESS', 'DISABILITY', 'TRAVEL', 'BUSINESS'].includes(insuranceInterest)
      ? insuranceInterest
      : 'GENERAL_INQUIRY';
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        contact_id: contactId,
        source: 'ORGANIC_SEARCH',
        landing_page: '/quote',
        insurance_interest: insuranceInterest,
        lead_status: 'NEW',
        lead_score: data.readyToProceed === 'yes' ? 70 : 50,
        notes,
      })
      .select('id')
      .single();
    if (leadError) throw leadError;

    const forwardedFor = req.headers['x-forwarded-for'];
    const ipAddress = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)?.split(',')[0]?.trim() || null;
    const userAgent = Array.isArray(req.headers['user-agent']) ? req.headers['user-agent'][0] : req.headers['user-agent'];
    const { error: funnelError } = await supabase.from('funnel_submissions').insert({
      lead_id: lead.id,
      contact_id: contactId,
      funnel_type: funnelType,
      source: 'ORGANIC_SEARCH',
      landing_page: '/quote',
      referring_url: Array.isArray(req.headers.referer) ? req.headers.referer[0] : req.headers.referer || null,
      submission_data: {
        insuranceType: data.insuranceType,
        insuranceAmount: data.insuranceAmount || null,
        readyToProceed: data.readyToProceed,
        smokingHistoryDisclosed: data.smokingHistory === 'yes',
        medicalHistoryDisclosed: data.medicalHistory === 'yes',
      },
      ip_address: ipAddress,
      user_agent: userAgent?.slice(0, 1000) || null,
    });
    if (funnelError) throw funnelError;

    return true;
  } catch (error) {
    console.error('CRM quote capture failed:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

async function sendViaGmail(
  data: QuoteFormData, 
  emailHtml: string, 
  timestamp: string
): Promise<{ success: boolean; error?: string }> {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
  
  if (!gmailUser || !gmailAppPassword) {
    return { success: false, error: 'Gmail credentials not configured' };
  }

  const transporter = createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Estate Nest" <${gmailUser}>`,
      to: getNotificationRecipients(),
      subject: `🏠 New Quote Request from ${data.firstName} ${data.lastName} - ${data.insuranceType}`,
      html: emailHtml,
      replyTo: data.email,
    });
    return { success: true };
  } catch (error) {
    console.error('Gmail send error:', error);
    return { success: false, error: String(error) };
  }
}

async function sendViaResend(
  data: QuoteFormData, 
  emailHtml: string
): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    return { success: false, error: 'Resend API key not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Estate Nest <onboarding@resend.dev>',
        to: getNotificationRecipients(),
        subject: `🏠 New Quote Request from ${data.firstName} ${data.lastName} - ${data.insuranceType}`,
        html: emailHtml,
        reply_to: data.email,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: JSON.stringify(errorData) };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Please use POST to submit the form.'
    });
  }

  try {
    const data = req.body as QuoteFormData;
    
    const validationErrors = validateFormData(data);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: validationErrors,
        message: 'Please correct the form errors'
      });
    }

    const timestamp = new Date().toLocaleString('en-CA', { 
      timeZone: 'America/Edmonton',
      dateStyle: 'full',
      timeStyle: 'long'
    });
    const cleanPhone = data.phone.replace(/\D/g, '');
    const emailHtml = generateEmailHtml(data, timestamp, cleanPhone);
    const crmSaved = await saveQuoteToCrm(data, req);

    // Try Gmail first, then fall back to Resend
    let emailResult = await sendViaGmail(data, emailHtml, timestamp);
    
    if (!emailResult.success) {
      console.log('Gmail failed, trying Resend...');
      emailResult = await sendViaResend(data, emailHtml);
    }

    if (!emailResult.success && !crmSaved) {
      console.error('All email providers failed:', emailResult.error);
      return res.status(503).json({
        success: false,
        message: 'Email service is not configured. Please contact us directly at hello@estatenest.ca or 780-860-3191.'
      });
    }

    if (!emailResult.success) {
      console.error('Quote was saved to CRM, but email notification failed:', emailResult.error);
    }

    return res.status(200).json({
      success: true,
      message: 'Your quote request has been submitted successfully. We will contact you within 24 hours.'
    });

  } catch (error) {
    console.error('Form submission error:', error);
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again or contact us directly at hello@estatenest.ca'
    });
  }
}
