// Email Service for EstateNest Management System
// Supports Resend and Gmail SMTP

interface EmailOptions {
  to: string[];
  subject: string;
  html: string;
  text?: string;
}

interface LeadNotificationData {
  contactName: string;
  email: string;
  phone?: string;
  province?: string;
  insuranceInterest: string;
  source: string;
  campaign?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  landingPage?: string;
  notes?: string;
  timestamp: string;
}

/**
 * Send email using Resend API
 */
async function sendWithResend(to: string[], subject: string, html: string, text?: string) {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    console.error('RESEND_API_KEY not configured');
    throw new Error('Email service not configured');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${process.env.EMAIL_FROM_NAME || 'Estate Nest'} <${process.env.EMAIL_FROM || 'noreply@estatenest.ca'}>`,
      to,
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Resend API error:', error);
    throw new Error(`Failed to send email: ${error}`);
  }

  return response.json();
}

/**
 * Send email using Gmail SMTP
 */
async function sendWithGmail(to: string[], subject: string, html: string, text?: string) {
  // Note: In browser/serverless environments, you'd typically use a library like nodemailer
  // For Vercel serverless, you can use the Gmail API directly
  // This is a placeholder - actual implementation would use nodemailer or Gmail API
  
  console.warn('Gmail SMTP not implemented - use Resend for production');
  throw new Error('Gmail SMTP not configured');
}

/**
 * Send email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Try Resend first, fallback to Gmail
    if (process.env.RESEND_API_KEY) {
      await sendWithResend(options.to, options.subject, options.html, options.text);
    } else if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      await sendWithGmail(options.to, options.subject, options.html, options.text);
    } else {
      console.warn('No email service configured - email not sent');
      console.log('Email would be sent to:', options.to);
      console.log('Subject:', options.subject);
      return false;
    }
    
    console.log('Email sent successfully to:', options.to);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Send lead notification to Estate Nest team
 */
export async function sendLeadNotification(lead: LeadNotificationData): Promise<boolean> {
  const recipients = [
    process.env.LEAD_NOTIFICATION_EMAIL_1 || 'hello@estatenest.ca',
    process.env.LEAD_NOTIFICATION_EMAIL_2 || 'kanwar@estatenest.ca',
  ].filter(Boolean);

  const subject = `New Lead: ${lead.contactName} - ${lead.insuranceInterest}`;
  
  const insuranceLabels: Record<string, string> = {
    TERM_LIFE: 'Term Life Insurance',
    WHOLE_LIFE: 'Whole Life Insurance',
    MORTGAGE_PROTECTION: 'Mortgage Protection',
    CRITICAL_ILLNESS: 'Critical Illness',
    DISABILITY: 'Disability Insurance',
    TRAVEL: 'Travel Insurance',
    BUSINESS: 'Business Insurance',
    SEGREGATED_FUNDS: 'Segregated Funds',
    OTHER: 'Other Insurance',
  };

  const sourceLabels: Record<string, string> = {
    ORGANIC_SEARCH: 'Google Organic Search',
    GOOGLE_BUSINESS: 'Google Business Profile',
    SOCIAL: 'Social Media',
    DIRECT: 'Direct',
    REFERRAL: 'Referral',
    MARBLISM: 'Marblism',
    EMAIL: 'Email Campaign',
    PAID_ADS: 'Paid Advertising',
    OTHER: 'Other',
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Lead Notification</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🎉 New Lead Received!</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">
      Someone is interested in your insurance services
    </p>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="color: #667eea; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
        Contact Information
      </h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; width: 140px;">Name:</td>
          <td style="padding: 8px 0; font-weight: 600; color: #111;">${lead.contactName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Email:</td>
          <td style="padding: 8px 0;"><a href="mailto:${lead.email}" style="color: #667eea;">${lead.email}</a></td>
        </tr>
        ${lead.phone ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Phone:</td>
          <td style="padding: 8px 0;"><a href="tel:${lead.phone.replace(/[^+\d]/g, '')}" style="color: #667eea;">${lead.phone}</a></td>
        </tr>
        ` : ''}
        ${lead.province ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Province:</td>
          <td style="padding: 8px 0;">${lead.province}</td>
        </tr>
        ` : ''}
      </table>
    </div>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="color: #667eea; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
        Lead Details
      </h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Insurance Interest:</td>
          <td style="padding: 8px 0; font-weight: 600;">${insuranceLabels[lead.insuranceInterest] || lead.insuranceInterest}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Source:</td>
          <td style="padding: 8px 0;">${sourceLabels[lead.source] || lead.source}</td>
        </tr>
        ${lead.campaign ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Campaign:</td>
          <td style="padding: 8px 0;">${lead.campaign}</td>
        </tr>
        ` : ''}
        ${lead.landingPage ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Landing Page:</td>
          <td style="padding: 8px 0;"><a href="${lead.landingPage}" style="color: #667eea; word-break: break-all;">${lead.landingPage}</a></td>
        </tr>
        ` : ''}
      </table>
    </div>
    
    ${lead.notes ? `
    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="color: #667eea; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
        Additional Notes
      </h2>
      <p style="margin: 0; color: #374151;">${lead.notes}</p>
    </div>
    ` : ''}
    
    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <p style="margin: 0; color: #6b7280; font-size: 13px;">
        <strong>Received:</strong> ${new Date(lead.timestamp).toLocaleString('en-CA', { timeZone: 'America/Edmonton' })} (MT)<br>
        ${lead.utmSource ? `<strong>UTM Source:</strong> ${lead.utmSource}<br>` : ''}
        ${lead.utmMedium ? `<strong>UTM Medium:</strong> ${lead.utmMedium}<br>` : ''}
        ${lead.utmCampaign ? `<strong>UTM Campaign:</strong> ${lead.utmCampaign}` : ''}
      </p>
    </div>
    
    <div style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_SUPABASE_URL ? process.env.NEXT_PUBLIC_SUPABASE_URL + '/project/default/tables/leads' : '#'}" 
         style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600;">
        View in CRM →
      </a>
    </div>
    
  </div>
  
  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0;">Estate Nest Inc. | Life Insurance & Financial Protection</p>
    <p style="margin: 5px 0 0 0;">This is an automated notification from your website.</p>
  </div>
  
</body>
</html>
  `;

  const text = `
New Lead Received!

Contact Information:
- Name: ${lead.contactName}
- Email: ${lead.email}
${lead.phone ? `- Phone: ${lead.phone}` : ''}
${lead.province ? `- Province: ${lead.province}` : ''}

Lead Details:
- Insurance Interest: ${insuranceLabels[lead.insuranceInterest] || lead.insuranceInterest}
- Source: ${sourceLabels[lead.source] || lead.source}
${lead.campaign ? `- Campaign: ${lead.campaign}` : ''}
${lead.landingPage ? `- Landing Page: ${lead.landingPage}` : ''}

${lead.notes ? `Additional Notes: ${lead.notes}` : ''}

Received: ${new Date(lead.timestamp).toLocaleString('en-CA', { timeZone: 'America/Edmonton' })}

---
Estate Nest Inc.
  `;

  return sendEmail({ to: recipients, subject, html, text });
}

/**
 * Send appointment reminder
 */
export async function sendAppointmentReminder(appointment: {
  leadName: string;
  title: string;
  date: string;
  duration: number;
  meetingType: string;
  meetingLink?: string;
  advisorEmail: string;
}): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Appointment Reminder</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="background: #3b82f6; padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">📅 Appointment Reminder</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <div style="background: white; padding: 20px; border-radius: 8px;">
      <h2 style="color: #111; margin: 0 0 15px 0;">${appointment.title}</h2>
      <p style="margin: 0 0 10px 0;"><strong>Client:</strong> ${appointment.leadName}</p>
      <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${new Date(appointment.date).toLocaleString('en-CA')}</p>
      <p style="margin: 0 0 10px 0;"><strong>Duration:</strong> ${appointment.duration} minutes</p>
      <p style="margin: 0;"><strong>Type:</strong> ${appointment.meetingType}</p>
      ${appointment.meetingLink ? `
      <p style="margin: 15px 0 0 0;">
        <a href="${appointment.meetingLink}" style="color: #3b82f6;">Join Meeting →</a>
      </p>
      ` : ''}
    </div>
  </div>
  
</body>
</html>
  `;

  return sendEmail({
    to: [appointment.advisorEmail],
    subject: `Reminder: ${appointment.title} - ${new Date(appointment.date).toLocaleDateString('en-CA')}`,
    html,
  });
}
