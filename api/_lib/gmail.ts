import { createTransport } from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer/index.js';

export const REQUIRED_LEAD_RECIPIENTS = ['hello@estatenest.ca', 'kanwar@estatenest.ca'] as const;

export interface GmailMessage {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: Mail.Attachment[];
}

export interface GmailSendResult {
  success: boolean;
  messageId?: string;
  errorCode?: string;
  errorMessage?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmailAddresses(values: unknown, maximum = 20): string[] {
  const entries = Array.isArray(values) ? values : typeof values === 'string' ? values.split(/[;,]/) : [];
  return Array.from(new Set(entries
    .map((value) => String(value || '').trim().toLowerCase())
    .filter((value) => EMAIL_PATTERN.test(value))))
    .slice(0, maximum);
}

export function getLeadNotificationRecipients(): string[] {
  return normalizeEmailAddresses([
    ...REQUIRED_LEAD_RECIPIENTS,
    process.env.LEAD_NOTIFICATION_EMAIL_1,
    process.env.LEAD_NOTIFICATION_EMAIL_2,
  ]);
}

export function gmailIsConfigured(): boolean {
  return Boolean(process.env.GMAIL_USER?.trim() && process.env.GMAIL_APP_PASSWORD?.trim());
}

function sanitizedError(error: unknown): Pick<GmailSendResult, 'errorCode' | 'errorMessage'> {
  if (!(error instanceof Error)) {
    return { errorCode: 'SMTP_UNKNOWN', errorMessage: 'Gmail SMTP rejected the message.' };
  }

  const smtpError = error as Error & { code?: string; responseCode?: number };
  const errorCode = String(smtpError.code || smtpError.responseCode || 'SMTP_ERROR').slice(0, 100);
  return { errorCode, errorMessage: `Gmail SMTP delivery failed (${errorCode}).` };
}

export async function sendGmailMessage(message: GmailMessage): Promise<GmailSendResult> {
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.trim();
  const to = normalizeEmailAddresses(message.to);
  const cc = normalizeEmailAddresses(message.cc || []);
  const bcc = normalizeEmailAddresses(message.bcc || []);

  if (!gmailUser || !gmailAppPassword) {
    return {
      success: false,
      errorCode: 'GMAIL_NOT_CONFIGURED',
      errorMessage: 'Gmail SMTP credentials are not configured.',
    };
  }

  if (!to.length || !message.subject.trim() || !message.html.trim()) {
    return {
      success: false,
      errorCode: 'INVALID_MESSAGE',
      errorMessage: 'The email is missing a recipient, subject, or body.',
    };
  }

  const transporter = createTransport({
    service: 'gmail',
    auth: { user: gmailUser, pass: gmailAppPassword },
  });

  try {
    const result = await transporter.sendMail({
      from: `"Estate Nest" <${gmailUser}>`,
      to,
      ...(cc.length ? { cc } : {}),
      ...(bcc.length ? { bcc } : {}),
      subject: message.subject.trim().slice(0, 500),
      html: message.html,
      ...(message.text ? { text: message.text } : {}),
      ...(message.replyTo && EMAIL_PATTERN.test(message.replyTo) ? { replyTo: message.replyTo } : {}),
      ...(message.attachments?.length ? { attachments: message.attachments } : {}),
    });

    return { success: true, messageId: String(result.messageId || '').slice(0, 500) || undefined };
  } catch (error) {
    return { success: false, ...sanitizedError(error) };
  }
}
