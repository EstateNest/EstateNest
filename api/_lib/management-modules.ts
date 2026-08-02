import { randomUUID } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getLeadNotificationRecipients, normalizeEmailAddresses, sendGmailMessage } from './gmail.js';
import type { SessionUser } from './session.js';
import { getSupabaseAdmin } from './supabase.js';

const ADVISOR_STAGES = new Set([
  'ADVISOR_PROSPECT', 'ADVISOR_LEAD', 'INITIAL_CONTACT', 'DISCOVERY_MEETING',
  'RECRUITMENT_REVIEW', 'OFFER_AGREEMENT', 'ADVISOR_RECRUITED', 'ONBOARDING',
  'LICENSING_AND_CONTRACTING', 'ACTIVE_ADVISOR', 'DEFERRED', 'NOT_PROCEEDING',
  'INACTIVE', 'ARCHIVED',
]);
const PRIVILEGED_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'MANAGER']);
const COMPLIANCE_STATUSES = new Set(['PENDING', 'COMPLIANT', 'REVIEW_REQUIRED', 'NON_COMPLIANT']);
const COMMISSION_STATUSES = new Set(['PENDING', 'APPROVED', 'RELEASED', 'PAID', 'HELD']);
const EMAIL_CONTEXTS = new Set(['CLIENT', 'ADVISOR', 'REPORT', 'COMPLIANCE', 'COMMISSION']);
const REPORT_TYPES = new Set(['LEADS', 'CLIENTS', 'ADVISORS', 'COMPLIANCE', 'COMMISSIONS']);
const REPORT_FORMATS = new Set(['CSV', 'EXCEL', 'PDF']);
const REPORT_RECIPIENTS = new Set(['hello@estatenest.ca', 'kanwar@estatenest.ca']);
const DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg', 'image/png', 'image/webp',
]);
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
const MAX_EMAIL_ATTACHMENTS = 10;
const MAX_EMAIL_ATTACHMENT_BYTES = 20 * 1024 * 1024;

function queryValue(req: VercelRequest, key: string): string {
  const value = req.query[key];
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function text(value: unknown, maximum = 1000): string | null {
  if (value === null || value === undefined) return null;
  return String(value).trim().slice(0, maximum) || null;
}

function dateValue(value: unknown): string | null {
  const normalized = text(value, 100);
  if (!normalized) return null;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function dateOnly(value: unknown): string | null {
  const normalized = text(value, 20);
  if (!normalized) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
  const date = new Date(`${normalized}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === normalized ? normalized : null;
}

function isPrivileged(user: SessionUser): boolean {
  return PRIVILEGED_ROLES.has(user.role.toUpperCase());
}

function requirePrivilege(user: SessionUser, res: VercelResponse): boolean {
  if (isPrivileged(user)) return true;
  res.status(403).json({ message: 'Administrator or manager access is required.' });
  return false;
}

async function writeAudit(user: SessionUser, action: string, entityType: string, entityId?: string, metadata: Record<string, unknown> = {}) {
  try {
    await getSupabaseAdmin().from('audit_log').insert({
      user_id: user.profileId || null,
      actor_auth_user_id: user.id,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      metadata,
    });
  } catch {
    console.error('Management module audit write failed');
    return;
  }
}

function maskIdentifier(value: unknown): string | null {
  const normalized = text(value, 255);
  if (!normalized) return null;
  const compact = normalized.replace(/\s/g, '');
  const lastFour = compact.slice(-4);
  return `${'•'.repeat(Math.max(4, Math.min(8, compact.length - 4)))}${lastFour}`;
}

function maskCompliance<T extends Record<string, unknown>>(row: T): T {
  return {
    ...row,
    life_licence_number: maskIdentifier(row.life_licence_number),
    accident_sickness_licence_number: maskIdentifier(row.accident_sickness_licence_number),
    eo_policy_number: maskIdentifier(row.eo_policy_number),
    cybersecurity_policy_number: maskIdentifier(row.cybersecurity_policy_number),
  };
}

function escapeHtml(value: unknown): string {
  return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function sanitizeEmailHtml(value: unknown): string {
  return String(value || '')
    .slice(0, 100_000)
    .replace(/<(script|iframe|object|embed|form)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, '')
    .replace(/javascript:/gi, '');
}

function emailHtmlFromText(value: string): string {
  const body = escapeHtml(value).replace(/\r?\n/g, '<br>');
  return `<div style="font-family:Arial,sans-serif;line-height:1.5">${body}</div><p><strong>Estate Nest</strong><br><a href="https://www.estatenest.ca">www.estatenest.ca</a><br>hello@estatenest.ca &middot; 780-860-3191</p>`;
}

function publicSiteUrl(): string {
  const configured = process.env.PUBLIC_SITE_URL?.trim();
  return configured && /^https:\/\//i.test(configured) ? configured.replace(/\/$/, '') : 'https://www.estatenest.ca';
}

async function defaultBcc(): Promise<string[]> {
  const { data } = await getSupabaseAdmin().from('management_settings').select('setting_value').eq('setting_key', 'email.default_bcc').maybeSingle();
  const value = data?.setting_value as { addresses?: unknown } | null;
  return normalizeEmailAddresses(value?.addresses || ['kanwar@estatenest.ca']);
}

async function handleAdvisors(req: VercelRequest, res: VercelResponse, user: SessionUser) {
  const supabase = getSupabaseAdmin();
  const id = queryValue(req, 'id') || text(req.body?.id, 100);

  if (req.method === 'GET') {
    const archived = queryValue(req, 'archived').toLowerCase() === 'true';
    let query = supabase.from('advisors').select('*, compliance:advisor_compliance(*)', { count: 'exact' }).order('created_at', { ascending: false }).limit(500);
    if (id) query = query.eq('id', id);
    else query = archived ? query.not('archived_at', 'is', null) : query.is('archived_at', null);
    const { data, error, count } = await query;
    if (error) throw error;
    const advisors = (data || []).map((advisor) => ({
      ...advisor,
      compliance: Array.isArray(advisor.compliance) ? advisor.compliance.map(maskCompliance) : advisor.compliance,
    }));
    if (id) return advisors[0] ? res.status(200).json({ success: true, advisor: advisors[0] }) : res.status(404).json({ message: 'Advisor not found' });
    return res.status(200).json({ success: true, advisors, total: count || 0 });
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const firstName = text(body.firstName, 100);
    const lastName = text(body.lastName, 100);
    if (!firstName || !lastName || (!text(body.email, 255) && !text(body.phone, 50))) {
      return res.status(400).json({ message: 'Advisor name and either email or phone are required.' });
    }
    const requestedStage = String(body.recruitmentStage || 'ADVISOR_PROSPECT').toUpperCase();
    const insert = advisorInput(body, user, ADVISOR_STAGES.has(requestedStage) ? requestedStage : 'ADVISOR_PROSPECT');
    if (!insert.assigned_recruiter) insert.assigned_recruiter = user.id;
    const { data, error } = await supabase.from('advisors').insert(insert).select().single();
    if (error) throw error;
    await writeAudit(user, 'CREATE', 'advisor', data.id);
    return res.status(201).json({ success: true, advisor: data });
  }

  if (req.method === 'PATCH') {
    if (!id) return res.status(400).json({ message: 'Advisor id is required.' });
    const body = req.body || {};
    const action = String(body.action || '').toUpperCase();
    const updates = advisorInput(body, user);
    let lifecycleReason: string | null = null;

    if (action === 'ARCHIVE' || action === 'RESTORE') {
      if (!requirePrivilege(user, res)) return;
      const reason = text(body.reason, 2000);
      if (!reason) return res.status(400).json({ message: `A reason is required to ${action.toLowerCase()} an advisor.` });
      lifecycleReason = reason;
      if (action === 'ARCHIVE') {
        Object.assign(updates, { archived_at: new Date().toISOString(), archived_reason: reason, archived_by: user.id, recruitment_stage: 'ARCHIVED' });
      } else {
        Object.assign(updates, { archived_at: null, archived_reason: null, archived_by: null, recruitment_stage: 'ADVISOR_PROSPECT' });
      }
    }

    const stage = String(body.recruitmentStage || '').toUpperCase();
    if (stage) {
      if (!ADVISOR_STAGES.has(stage) || stage === 'ARCHIVED') return res.status(400).json({ message: 'Select a valid advisor stage.' });
      if (['DEFERRED', 'NOT_PROCEEDING'].includes(stage) && !text(body.stageReason, 2000)) {
        return res.status(400).json({ message: 'A reason is required for deferred or not-proceeding advisors.' });
      }
      Object.assign(updates, { recruitment_stage: stage, stage_reason: text(body.stageReason, 2000), stage_changed_at: new Date().toISOString(), stage_changed_by: user.id });
    }
    if (!Object.keys(updates).length) return res.status(400).json({ message: 'No valid advisor changes were supplied.' });
    const { data, error } = await supabase.from('advisors').update(updates).eq('id', id).select().single();
    if (error) throw error;
    await writeAudit(user, lifecycleReason ? action : 'UPDATE', 'advisor', id, lifecycleReason ? { reason: lifecycleReason } : { fields: Object.keys(updates) });
    return res.status(200).json({ success: true, advisor: data });
  }

  if (req.method === 'DELETE') {
    if (!requirePrivilege(user, res)) return;
    if (!id) return res.status(400).json({ message: 'Advisor id is required.' });
    const reason = text(req.body?.reason, 2000);
    if (!reason) return res.status(400).json({ message: 'An archive reason is required.' });
    const { error } = await supabase.from('advisors').update({ archived_at: new Date().toISOString(), archived_reason: reason, archived_by: user.id, recruitment_stage: 'ARCHIVED' }).eq('id', id);
    if (error) throw error;
    await writeAudit(user, 'ARCHIVE', 'advisor', id, { reason });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

function advisorInput(body: Record<string, unknown>, user: SessionUser, stage?: string): Record<string, unknown> {
  const mapping: Array<[string, string, number]> = [
    ['firstName', 'first_name', 100], ['lastName', 'last_name', 100], ['email', 'email', 255],
    ['phone', 'phone', 50], ['alternatePhone', 'alternate_phone', 50], ['address', 'address', 1000],
    ['city', 'city', 100], ['province', 'province', 50], ['postalCode', 'postal_code', 20],
    ['previousMga', 'previous_mga', 255], ['newMga', 'new_mga', 255], ['reasonForLeaving', 'reason_for_leaving', 2000],
    ['advisorNotes', 'advisor_notes', 5000], ['goals', 'goals', 5000], ['stageReason', 'stage_reason', 2000],
  ];
  const result: Record<string, unknown> = {};
  mapping.forEach(([input, column, maximum]) => {
    if (body[input] !== undefined) result[column] = text(body[input], maximum);
  });
  if (body.email !== undefined && result.email) result.email = String(result.email).toLowerCase();
  if (body.nextFollowUpAt !== undefined) result.next_follow_up_at = dateValue(body.nextFollowUpAt);
  if (body.assignedRecruiter !== undefined) result.assigned_recruiter = text(body.assignedRecruiter, 100);
  if (stage) Object.assign(result, { recruitment_stage: stage, stage_changed_at: new Date().toISOString(), stage_changed_by: user.id });
  return result;
}

async function handleCompliance(req: VercelRequest, res: VercelResponse, user: SessionUser) {
  if (!requirePrivilege(user, res)) return;
  const advisorId = queryValue(req, 'advisorId') || text(req.body?.advisorId, 100);
  const supabase = getSupabaseAdmin();
  if (req.method === 'GET') {
    let query = supabase.from('advisor_compliance').select('*, advisor:advisors(id, first_name, last_name, email, recruitment_stage)').order('next_review_date', { ascending: true, nullsFirst: false }).limit(500);
    if (advisorId) query = query.eq('advisor_id', advisorId);
    const { data, error } = await query;
    if (error) throw error;
    return res.status(200).json({ success: true, compliance: (data || []).map(maskCompliance) });
  }
  if (req.method !== 'PATCH' && req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  if (!advisorId) return res.status(400).json({ message: 'Advisor id is required.' });
  const body = req.body || {};
  const lastFour = text(body.bankingLastFour, 4);
  if (lastFour && !/^\d{4}$/.test(lastFour)) return res.status(400).json({ message: 'Banking last four must contain exactly four digits.' });
  const complianceStatus = String(body.complianceStatus || '').toUpperCase();
  if (body.complianceStatus !== undefined && !COMPLIANCE_STATUSES.has(complianceStatus)) {
    return res.status(400).json({ message: 'Select a valid compliance status.' });
  }
  const fields: Array<[string, string, number]> = [
    ['lifeLicenceNumber', 'life_licence_number', 255], ['accidentSicknessLicenceNumber', 'accident_sickness_licence_number', 255],
    ['licenceProvince', 'licence_province', 50], ['eoPolicyNumber', 'eo_policy_number', 255], ['eoProvider', 'eo_provider', 255],
    ['cybersecurityPolicyNumber', 'cybersecurity_policy_number', 255], ['cybersecurityProvider', 'cybersecurity_provider', 255],
    ['insurancePracticeSponsorship', 'insurance_practice_sponsorship', 1000], ['sponsoringCompany', 'sponsoring_company', 255],
    ['mga', 'mga', 255], ['complianceStatus', 'compliance_status', 50], ['outstandingDocuments', 'outstanding_documents', 5000],
    ['bankingSecureDocumentReference', 'banking_secure_document_reference', 1000],
  ];
  const record: Record<string, unknown> = { advisor_id: advisorId, updated_by: user.id };
  fields.forEach(([input, column, maximum]) => { if (body[input] !== undefined) record[column] = text(body[input], maximum); });
  if (body.complianceStatus !== undefined) record.compliance_status = complianceStatus;
  const dates = [
    ['lifeLicenceIssueDate', 'life_licence_issue_date'], ['lifeLicenceExpiryDate', 'life_licence_expiry_date'],
    ['accidentSicknessIssueDate', 'accident_sickness_issue_date'], ['accidentSicknessExpiryDate', 'accident_sickness_expiry_date'],
    ['eoEffectiveDate', 'eo_effective_date'], ['eoExpiryDate', 'eo_expiry_date'],
    ['cybersecurityEffectiveDate', 'cybersecurity_effective_date'], ['cybersecurityExpiryDate', 'cybersecurity_expiry_date'],
    ['nextReviewDate', 'next_review_date'], ['bankingReceivedDate', 'banking_received_date'], ['bankingVerifiedDate', 'banking_verified_date'],
  ] as const;
  for (const [input, column] of dates) {
    if (body[input] === undefined) continue;
    const supplied = text(body[input], 20);
    const normalized = dateOnly(body[input]);
    if (supplied && !normalized) return res.status(400).json({ message: `${input} must be a valid calendar date.` });
    record[column] = normalized;
  }
  if (body.bankingInformationReceived !== undefined) record.banking_information_received = Boolean(body.bankingInformationReceived);
  if (body.bankingVerifiedDate !== undefined) record.banking_verified_by = record.banking_verified_date ? user.id : null;
  if (body.bankingLastFour !== undefined) record.banking_last_four = lastFour;
  if (Object.keys(record).length === 2) return res.status(400).json({ message: 'No valid compliance changes were supplied.' });
  const { data, error } = await supabase.from('advisor_compliance').upsert(record, { onConflict: 'advisor_id' }).select().single();
  if (error) throw error;
  await writeAudit(user, 'UPSERT', 'advisor_compliance', data.id, { fields: Object.keys(record).filter((key) => !key.includes('number')) });
  return res.status(200).json({ success: true, compliance: maskCompliance(data) });
}

async function handleCarriers(req: VercelRequest, res: VercelResponse, user: SessionUser) {
  const supabase = getSupabaseAdmin();
  const id = queryValue(req, 'id') || text(req.body?.id, 100);
  if (req.method === 'GET') {
    let query = supabase.from('carrier_mga_directory').select('*').order('company_name').limit(500);
    if (id) query = query.eq('id', id);
    const { data, error } = await query;
    if (error) throw error;
    return res.status(200).json({ success: true, carriers: data || [] });
  }
  if (!requirePrivilege(user, res)) return;
  if (!['POST', 'PATCH'].includes(req.method || '')) return res.status(405).json({ message: 'Method not allowed' });
  if (req.method === 'PATCH' && !id) return res.status(400).json({ message: 'Directory id is required.' });
  const body = req.body || {};
  const companyName = text(body.companyName, 255);
  if (req.method === 'POST' && !companyName) return res.status(400).json({ message: 'Company name is required. Do not invent missing contact details.' });
  const record: Record<string, unknown> = {};
  const fields: Array<[string, string, number]> = [
    ['companyName', 'company_name', 255], ['contractingEmail', 'contracting_email', 255], ['complianceEmail', 'compliance_email', 255],
    ['mgaName', 'mga_name', 255], ['mgaEmail', 'mga_email', 255], ['portalUrl', 'portal_url', 1000], ['contactPerson', 'contact_person', 255],
  ];
  fields.forEach(([input, column, maximum]) => { if (body[input] !== undefined) record[column] = text(body[input], maximum); });
  if (body.isActive !== undefined) record.is_active = Boolean(body.isActive);
  record[req.method === 'POST' ? 'created_by' : 'updated_by'] = user.id;
  const query = req.method === 'POST' ? supabase.from('carrier_mga_directory').insert(record) : supabase.from('carrier_mga_directory').update(record).eq('id', id!);
  const { data, error } = await query.select().single();
  if (error) throw error;
  await writeAudit(user, req.method === 'POST' ? 'CREATE' : 'UPDATE', 'carrier_mga', data.id);
  return res.status(req.method === 'POST' ? 201 : 200).json({ success: true, carrier: data });
}

async function handleAdvisorContracts(req: VercelRequest, res: VercelResponse, user: SessionUser) {
  if (!requirePrivilege(user, res)) return;
  const supabase = getSupabaseAdmin();
  const id = queryValue(req, 'id') || text(req.body?.id, 100);
  const advisorId = queryValue(req, 'advisorId') || text(req.body?.advisorId, 100);

  if (req.method === 'GET') {
    let query = supabase.from('advisor_contracts').select('*, carrier:carrier_mga_directory(id, company_name, mga_name)').order('created_at', { ascending: false }).limit(500);
    if (id) query = query.eq('id', id);
    if (advisorId) query = query.eq('advisor_id', advisorId);
    const { data, error } = await query;
    if (error) throw error;
    return res.status(200).json({ success: true, contracts: data || [] });
  }

  if (!['POST', 'PATCH'].includes(req.method || '')) return res.status(405).json({ message: 'Method not allowed' });
  if (req.method === 'POST' && (!advisorId || !text(req.body?.companyName, 255))) {
    return res.status(400).json({ message: 'Advisor and verified company name are required.' });
  }
  if (req.method === 'PATCH' && !id) return res.status(400).json({ message: 'Advisor contract id is required.' });

  const body = req.body || {};
  const record: Record<string, unknown> = {};
  const fields: Array<[string, string, number]> = [
    ['advisorId', 'advisor_id', 100], ['carrierMgaId', 'carrier_mga_id', 100], ['companyName', 'company_name', 255],
    ['sponsorshipStatus', 'sponsorship_status', 50], ['notes', 'notes', 5000],
  ];
  fields.forEach(([input, column, maximum]) => { if (body[input] !== undefined) record[column] = text(body[input], maximum); });
  if (req.method === 'POST') record.advisor_id = advisorId;
  if (body.advisorCode !== undefined) record.advisor_code_masked = maskIdentifier(body.advisorCode);
  for (const [input, column] of [['effectiveDate', 'effective_date'], ['endDate', 'end_date']] as const) {
    if (body[input] === undefined) continue;
    const supplied = text(body[input], 20);
    const normalized = dateOnly(body[input]);
    if (supplied && !normalized) return res.status(400).json({ message: `${input} must be a valid calendar date.` });
    record[column] = normalized;
  }
  if (!Object.keys(record).length) return res.status(400).json({ message: 'No valid advisor contract changes were supplied.' });
  if (req.method === 'POST') record.created_by = user.id;

  const query = req.method === 'POST'
    ? supabase.from('advisor_contracts').insert(record)
    : supabase.from('advisor_contracts').update(record).eq('id', id!);
  const { data, error } = await query.select().single();
  if (error) throw error;
  await writeAudit(user, req.method === 'POST' ? 'CREATE' : 'UPDATE', 'advisor_contract', data.id, { fields: Object.keys(record).filter((field) => field !== 'advisor_code_masked') });
  return res.status(req.method === 'POST' ? 201 : 200).json({ success: true, contract: data });
}

async function handleCommissions(req: VercelRequest, res: VercelResponse, user: SessionUser) {
  if (!requirePrivilege(user, res)) return;
  const supabase = getSupabaseAdmin();
  const id = queryValue(req, 'id') || text(req.body?.id, 100);
  if (req.method === 'GET') {
    let query = supabase.from('commission_records').select('*, advisor:advisors(id, first_name, last_name, email)').order('created_at', { ascending: false }).limit(500);
    if (id) query = query.eq('id', id);
    const advisorId = queryValue(req, 'advisorId');
    if (advisorId) query = query.eq('advisor_id', advisorId);
    const { data, error } = await query;
    if (error) throw error;
    return res.status(200).json({ success: true, commissions: data || [] });
  }
  if (!['POST', 'PATCH'].includes(req.method || '')) return res.status(405).json({ message: 'Method not allowed' });
  if (req.method === 'PATCH' && !id) return res.status(400).json({ message: 'Commission id is required.' });
  const body = req.body || {};
  if (req.method === 'POST' && (!text(body.advisorId, 100) || !text(body.policyReference, 255) || !text(body.insurer, 255))) {
    return res.status(400).json({ message: 'Advisor, policy reference, and insurer are required.' });
  }
  const record: Record<string, unknown> = { updated_by: user.id };
  const fields: Array<[string, string, number]> = [
    ['advisorId', 'advisor_id', 100], ['policyReference', 'policy_reference', 255], ['insurer', 'insurer', 255],
    ['productType', 'product_type', 255], ['commissionStatus', 'commission_status', 50], ['notes', 'notes', 5000],
  ];
  fields.forEach(([input, column, maximum]) => { if (body[input] !== undefined) record[column] = text(body[input], maximum); });
  const commissionStatus = String(body.commissionStatus || '').toUpperCase();
  if (body.commissionStatus !== undefined && !COMMISSION_STATUSES.has(commissionStatus)) {
    return res.status(400).json({ message: 'Select a valid commission status.' });
  }
  if (body.commissionStatus !== undefined) record.commission_status = commissionStatus;
  if (body.policyNumber !== undefined) record.policy_number_masked = maskIdentifier(body.policyNumber);
  if (body.commissionPercentage !== undefined) {
    const percentage = Number(body.commissionPercentage);
    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) return res.status(400).json({ message: 'Commission percentage must be from 0 to 100.' });
    record.commission_percentage = percentage;
  }
  if (body.commissionAmount !== undefined) {
    const amount = Number(body.commissionAmount);
    if (!Number.isFinite(amount) || amount < 0) return res.status(400).json({ message: 'Commission amount must be zero or greater.' });
    record.commission_amount = amount;
  }
  for (const input of ['policyEffectiveDate', 'commissionReleaseDate', 'paymentDate', 'annualReminderDate'] as const) {
    if (body[input] === undefined) continue;
    const supplied = text(body[input], 20);
    const normalized = dateOnly(body[input]);
    if (supplied && !normalized) return res.status(400).json({ message: `${input} must be a valid calendar date.` });
    record[input.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)] = normalized;
  }
  if (['APPROVED', 'RELEASED', 'PAID'].includes(commissionStatus) || body.approve === true) record.approved_by = user.id;
  if (req.method === 'POST') record.created_by = user.id;
  const query = req.method === 'POST' ? supabase.from('commission_records').insert(record) : supabase.from('commission_records').update(record).eq('id', id!);
  const { data, error } = await query.select().single();
  if (error) throw error;
  await writeAudit(user, req.method === 'POST' ? 'CREATE' : 'UPDATE', 'commission', data.id, { fields: Object.keys(record) });
  return res.status(req.method === 'POST' ? 201 : 200).json({ success: true, commission: data });
}

async function handleNotifications(req: VercelRequest, res: VercelResponse, user: SessionUser) {
  const supabase = getSupabaseAdmin();
  if (req.method === 'GET') {
    const status = queryValue(req, 'status').toUpperCase();
    let query = supabase.from('quote_notifications').select('*, lead:leads(id, public_id, insurance_interest, source, created_at, contact:contacts(first_name, last_name, email, phone, province))').order('created_at', { ascending: false }).limit(300);
    if (['QUEUED', 'SENT', 'DELIVERED', 'FAILED'].includes(status)) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    return res.status(200).json({ success: true, notifications: data || [] });
  }
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const id = text(req.body?.id, 100);
  if (String(req.body?.action || '').toUpperCase() !== 'RETRY' || !id) return res.status(400).json({ message: 'A failed notification id is required.' });
  const { data: notification, error } = await supabase.from('quote_notifications').select('*, lead:leads(id, public_id, insurance_interest, source, created_at, contact:contacts(first_name, last_name, email, phone, province))').eq('id', id).single();
  if (error || !notification) return res.status(404).json({ message: 'Notification not found.' });
  if (notification.status !== 'FAILED') return res.status(409).json({ message: 'Only failed notifications can be retried.' });
  const lead = notification.lead as Record<string, unknown>;
  const contact = lead?.contact as Record<string, unknown> | undefined;
  if (!lead?.id || !contact) return res.status(409).json({ message: 'The preserved lead record is incomplete and requires review.' });
  const lockTime = new Date().toISOString();
  const { data: locked, error: lockError } = await supabase.from('quote_notifications')
    .update({ status: 'QUEUED', last_attempt_at: lockTime })
    .eq('id', id)
    .eq('status', 'FAILED')
    .select('id')
    .maybeSingle();
  if (lockError) throw lockError;
  if (!locked) return res.status(409).json({ message: 'This notification retry is already in progress.' });

  const crmUrl = `${publicSiteUrl()}/management/leads/${lead.id}`;
  const fields = [
    ['Lead ID', lead.public_id], ['Name', `${contact.first_name || ''} ${contact.last_name || ''}`.trim()],
    ['Email', contact.email], ['Phone', contact.phone], ['Province', contact.province],
    ['Insurance interest', lead.insurance_interest], ['Source', 'estatenest.ca/quote'], ['Submitted', lead.created_at],
  ];
  const result = await sendGmailMessage({
    to: getLeadNotificationRecipients(),
    subject: `Retry: Estate Nest quote lead ${lead.public_id}`,
    html: `<h1>Quote lead notification</h1><table>${fields.map(([label, value]) => `<tr><th align="left">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('')}</table><p><a href="${escapeHtml(crmUrl)}">Open secure CRM record</a></p><p>Sensitive health, medication, underwriting, and coverage-amount details are excluded.</p>`,
    text: [...fields.map(([label, value]) => `${label}: ${value || 'Not provided'}`), `Secure CRM: ${crmUrl}`].join('\n'),
    replyTo: text(contact.email, 255) || undefined,
  });
  const attempts = Number(notification.attempt_count || 0) + 1;
  const now = new Date().toISOString();
  const { error: updateError } = await supabase.from('quote_notifications').update(result.success ? {
    status: 'SENT', provider_message_id: result.messageId || null, attempt_count: attempts,
    sent_at: now, last_attempt_at: now, failed_at: null, last_error_code: null, last_error_message: null, next_retry_at: null,
  } : {
    status: 'FAILED', attempt_count: attempts, failed_at: now, last_attempt_at: now,
    last_error_code: result.errorCode, last_error_message: result.errorMessage, next_retry_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  }).eq('id', id);
  if (updateError) throw updateError;
  await writeAudit(user, 'RETRY', 'quote_notification', id, { result: result.success ? 'SENT' : 'FAILED' });
  return res.status(result.success ? 200 : 502).json({ success: result.success, status: result.success ? 'SENT' : 'FAILED', message: result.errorMessage });
}

async function handleEmails(req: VercelRequest, res: VercelResponse, user: SessionUser) {
  const supabase = getSupabaseAdmin();
  const id = queryValue(req, 'id') || text(req.body?.id, 100);
  if (req.method === 'GET') {
    let query = supabase.from('email_messages').select('*, attachments:email_attachments(*, document:management_documents(*))').order('created_at', { ascending: false }).limit(300);
    if (id) query = query.eq('id', id);
    const { data, error } = await query;
    if (error) throw error;
    return res.status(200).json({ success: true, messages: data || [], defaultBcc: await defaultBcc() });
  }
  if (req.method !== 'POST' && req.method !== 'PATCH') return res.status(405).json({ message: 'Method not allowed' });
  const body = req.body || {};
  const action = String(body.action || 'SAVE_DRAFT').toUpperCase();
  if (action === 'SAVE_DRAFT') {
    const contextType = String(body.contextType || '').toUpperCase();
    if (!EMAIL_CONTEXTS.has(contextType)) return res.status(400).json({ message: 'Select a valid email context.' });
    const to = normalizeEmailAddresses(body.to);
    const cc = normalizeEmailAddresses(body.cc);
    const configuredBcc = await defaultBcc();
    const bcc = normalizeEmailAddresses([...normalizeEmailAddresses(body.bcc), ...configuredBcc]);
    const bodyText = text(body.bodyText, 100_000);
    const record = {
      context_type: contextType,
      context_id: text(body.contextId, 100),
      template_key: text(body.templateKey, 100),
      to_addresses: to,
      cc_addresses: cc,
      bcc_addresses: bcc,
      subject: text(body.subject, 500) || '',
      body_html: bodyText ? emailHtmlFromText(bodyText) : sanitizeEmailHtml(body.bodyHtml),
      body_text: bodyText,
      status: 'DRAFT',
      updated_by: user.id,
    };
    const query = id ? supabase.from('email_messages').update(record).eq('id', id) : supabase.from('email_messages').insert({ ...record, created_by: user.id });
    const { data, error } = await query.select().single();
    if (error) throw error;
    await writeAudit(user, id ? 'UPDATE_DRAFT' : 'CREATE_DRAFT', 'email_message', data.id);
    return res.status(id ? 200 : 201).json({ success: true, message: data });
  }
  if (!id) return res.status(400).json({ message: 'Email message id is required.' });
  if (action === 'ATTACH') {
    const documentId = text(body.documentId, 100);
    if (!documentId) return res.status(400).json({ message: 'Document id is required.' });
    const { data: document, error: documentError } = await supabase.from('management_documents').select('id, owner_type, owner_id, scan_status').eq('id', documentId).single();
    if (documentError || !document) return res.status(404).json({ message: 'Secure document not found.' });
    if (document.owner_type !== 'EMAIL' || document.owner_id !== id) return res.status(403).json({ message: 'Document is not assigned to this email draft.' });
    const { error } = await supabase.from('email_attachments').insert({ email_message_id: id, document_id: documentId });
    if (error) throw error;
    await writeAudit(user, 'ATTACH', 'email_message', id, { documentId, scanStatus: document.scan_status });
    return res.status(200).json({ success: true, scanStatus: document.scan_status });
  }
  if (action === 'PREVIEW') {
    const { data: draft, error: draftError } = await supabase.from('email_messages').select('to_addresses, subject, body_html').eq('id', id).single();
    if (draftError || !draft) return res.status(404).json({ message: 'Email draft not found.' });
    if (!normalizeEmailAddresses(draft.to_addresses).length || !String(draft.subject || '').trim() || !String(draft.body_html || '').trim()) {
      return res.status(400).json({ message: 'Recipient, subject, and body are required before preview.' });
    }
    const { data, error } = await supabase.from('email_messages').update({ status: 'PREVIEWED', previewed_at: new Date().toISOString(), updated_by: user.id }).eq('id', id).select().single();
    if (error) throw error;
    await writeAudit(user, 'PREVIEW', 'email_message', id);
    return res.status(200).json({ success: true, message: data });
  }
  if (action === 'CANCEL') {
    const { data, error } = await supabase.from('email_messages').update({ status: 'CANCELLED', updated_by: user.id }).eq('id', id).in('status', ['DRAFT', 'PREVIEWED', 'FAILED']).select('id').maybeSingle();
    if (error) throw error;
    if (!data) return res.status(409).json({ message: 'Only a draft, previewed, or failed message can be cancelled.' });
    await writeAudit(user, 'CANCEL', 'email_message', id);
    return res.status(200).json({ success: true });
  }
  if (!['SEND', 'RETRY'].includes(action) || body.confirm !== true) {
    return res.status(400).json({ message: 'Preview and explicit send confirmation are required.' });
  }
  const { data: message, error } = await supabase.from('email_messages').select('*, attachments:email_attachments(*, document:management_documents(*))').eq('id', id).single();
  if (error || !message) return res.status(404).json({ message: 'Email draft not found.' });
  if (!message.previewed_at || (action === 'SEND' && message.status !== 'PREVIEWED') || (action === 'RETRY' && message.status !== 'FAILED')) {
    return res.status(409).json({ message: action === 'RETRY' ? 'Only a failed previewed message can be retried.' : 'Preview this draft before sending.' });
  }
  const attachments = (message.attachments || []) as Array<{ document: { scan_status: string; storage_bucket: string; storage_path: string; original_name: string; mime_type: string; size_bytes: number } }>;
  if (attachments.some((attachment) => attachment.document.scan_status !== 'CLEAN')) {
    return res.status(409).json({ message: 'Every attachment must pass malware scanning before send.' });
  }
  const attachmentBytes = attachments.reduce((total, attachment) => total + Number(attachment.document.size_bytes || 0), 0);
  if (attachments.length > MAX_EMAIL_ATTACHMENTS || attachmentBytes > MAX_EMAIL_ATTACHMENT_BYTES) {
    return res.status(409).json({ message: 'Email attachments exceed the approved count or 20 MiB combined limit.' });
  }

  const expectedStatus = action === 'SEND' ? 'PREVIEWED' : 'FAILED';
  const confirmedAt = new Date().toISOString();
  const { data: locked, error: lockError } = await supabase.from('email_messages')
    .update({ status: 'QUEUED', confirmed_at: confirmedAt, confirmed_by: user.id, updated_by: user.id })
    .eq('id', id)
    .eq('status', expectedStatus)
    .select('id')
    .maybeSingle();
  if (lockError) throw lockError;
  if (!locked) return res.status(409).json({ message: 'This email send is already in progress or its status changed.' });

  const mailAttachments = [];
  for (const attachment of attachments) {
    const downloaded = await supabase.storage.from(attachment.document.storage_bucket).download(attachment.document.storage_path);
    if (downloaded.error) {
      await supabase.from('email_messages').update({ status: 'FAILED', failed_at: new Date().toISOString(), last_error_code: 'ATTACHMENT_RETRIEVAL_FAILED', last_error_message: 'A secure attachment could not be retrieved.', updated_by: user.id }).eq('id', id);
      return res.status(409).json({ message: 'A secure attachment could not be retrieved.' });
    }
    mailAttachments.push({ filename: attachment.document.original_name, content: Buffer.from(await downloaded.data.arrayBuffer()), contentType: attachment.document.mime_type });
  }
  const mandatoryBcc = await defaultBcc();
  const sendResult = await sendGmailMessage({
    to: normalizeEmailAddresses(message.to_addresses), cc: normalizeEmailAddresses(message.cc_addresses), bcc: normalizeEmailAddresses([...normalizeEmailAddresses(message.bcc_addresses), ...mandatoryBcc]),
    subject: message.subject, html: message.body_html, text: message.body_text || undefined, attachments: mailAttachments,
  });
  const now = new Date().toISOString();
  const { error: statusError } = await supabase.from('email_messages').update(sendResult.success ? {
    status: 'SENT', sent_at: now, confirmed_at: now, confirmed_by: user.id, provider_message_id: sendResult.messageId || null,
    attempt_count: Number(message.attempt_count || 0) + 1, last_error_code: null, last_error_message: null, failed_at: null, updated_by: user.id,
  } : {
    status: 'FAILED', failed_at: now, confirmed_at: now, confirmed_by: user.id,
    attempt_count: Number(message.attempt_count || 0) + 1, last_error_code: sendResult.errorCode, last_error_message: sendResult.errorMessage, updated_by: user.id,
  }).eq('id', id);
  if (statusError) throw statusError;
  await writeAudit(user, action, 'email_message', id, { result: sendResult.success ? 'SENT' : 'FAILED', attachmentCount: attachments.length });
  return res.status(sendResult.success ? 200 : 502).json({ success: sendResult.success, status: sendResult.success ? 'SENT' : 'FAILED', message: sendResult.errorMessage });
}

async function handleDocuments(req: VercelRequest, res: VercelResponse, user: SessionUser) {
  const supabase = getSupabaseAdmin();
  if (req.method === 'GET') {
    const ownerId = queryValue(req, 'ownerId');
    let query = supabase.from('management_documents').select('id, owner_type, owner_id, original_name, mime_type, size_bytes, scan_status, created_at').order('created_at', { ascending: false }).limit(300);
    if (ownerId) query = query.eq('owner_id', ownerId);
    const { data, error } = await query;
    if (error) throw error;
    return res.status(200).json({ success: true, documents: data || [] });
  }
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const body = req.body || {};
  const fileName = text(body.fileName, 255);
  const mimeType = text(body.mimeType, 150)?.toLowerCase();
  const sizeBytes = Number(body.sizeBytes);
  const ownerType = String(body.ownerType || '').toUpperCase();
  const ownerId = text(body.ownerId, 100);
  if (!fileName || !mimeType || !ownerId || !['CONTACT', 'LEAD', 'ADVISOR', 'COMPLIANCE', 'COMMISSION', 'EMAIL'].includes(ownerType)) {
    return res.status(400).json({ message: 'Document owner and file metadata are required.' });
  }
  if (!DOCUMENT_MIME_TYPES.has(mimeType) || !Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_DOCUMENT_SIZE) {
    return res.status(400).json({ message: 'Attachment type is not approved or exceeds the 10 MiB limit.' });
  }
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-180);
  const storagePath = `${ownerType.toLowerCase()}/${ownerId}/${randomUUID()}-${safeName}`;
  const signed = await supabase.storage.from('management-documents').createSignedUploadUrl(storagePath);
  if (signed.error) throw signed.error;
  const { data, error } = await supabase.from('management_documents').insert({
    owner_type: ownerType, owner_id: ownerId, storage_path: storagePath, original_name: fileName,
    mime_type: mimeType, size_bytes: sizeBytes, scan_status: 'PENDING', uploaded_by: user.id,
  }).select('id, original_name, mime_type, size_bytes, scan_status').single();
  if (error) throw error;
  await writeAudit(user, 'CREATE_UPLOAD', 'management_document', data.id, { ownerType, mimeType, sizeBytes });
  return res.status(201).json({ success: true, document: data, uploadUrl: signed.data.signedUrl, token: signed.data.token });
}

type ReportRow = Record<string, string | number | boolean | null>;

async function reportRows(reportType: string, filters: Record<string, unknown>): Promise<ReportRow[]> {
  const supabase = getSupabaseAdmin();
  if (reportType === 'LEADS' || reportType === 'CLIENTS') {
    let query = supabase.from('leads').select('public_id, pipeline_stage, source, insurance_interest, created_at, next_follow_up_at, contact:contacts(first_name, last_name, email, phone, province, city)').is('archived_at', null).order('created_at', { ascending: false }).limit(1000);
    if (text(filters.stage, 50)) query = query.eq('pipeline_stage', text(filters.stage, 50)!);
    if (text(filters.source, 50)) query = query.eq('source', text(filters.source, 50)!);
    if (reportType === 'CLIENTS') query = query.in('pipeline_stage', ['POLICY_DELIVERED', 'ACTIVE_CLIENT']);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((row) => {
      const contact = row.contact as unknown as Record<string, unknown>;
      return {
        lead_id: row.public_id, name: `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim(),
        email: String(contact?.email || ''), phone: String(contact?.phone || ''), province: String(contact?.province || ''),
        stage: row.pipeline_stage, source: row.source, insurance_interest: row.insurance_interest,
        created_at: row.created_at, next_follow_up_at: row.next_follow_up_at,
      };
    });
  }
  if (reportType === 'ADVISORS') {
    let query = supabase.from('advisors').select('first_name, last_name, email, phone, province, recruitment_stage, next_follow_up_at, created_at').is('archived_at', null).order('created_at', { ascending: false }).limit(1000);
    if (text(filters.stage, 50)) query = query.eq('recruitment_stage', text(filters.stage, 50)!);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((row) => ({ ...row, name: `${row.first_name} ${row.last_name}` }));
  }
  if (reportType === 'COMPLIANCE') {
    let query = supabase.from('advisor_compliance').select('licence_province, compliance_status, life_licence_expiry_date, accident_sickness_expiry_date, eo_expiry_date, cybersecurity_expiry_date, next_review_date, advisor:advisors(first_name, last_name, email)').order('next_review_date', { ascending: true, nullsFirst: false }).limit(1000);
    if (text(filters.stage, 50)) query = query.eq('compliance_status', text(filters.stage, 50)!);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((row) => {
      const advisor = row.advisor as unknown as Record<string, unknown>;
      return { advisor: `${advisor?.first_name || ''} ${advisor?.last_name || ''}`.trim(), email: String(advisor?.email || ''), province: row.licence_province, status: row.compliance_status, life_expiry: row.life_licence_expiry_date, as_expiry: row.accident_sickness_expiry_date, eo_expiry: row.eo_expiry_date, cyber_expiry: row.cybersecurity_expiry_date, next_review: row.next_review_date };
    });
  }
  let query = supabase.from('commission_records').select('policy_reference, policy_number_masked, insurer, product_type, commission_percentage, commission_amount, commission_status, policy_effective_date, commission_release_date, payment_date, advisor:advisors(first_name, last_name)').order('created_at', { ascending: false }).limit(1000);
  if (text(filters.stage, 50)) query = query.eq('commission_status', text(filters.stage, 50)!);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((row) => {
    const advisor = row.advisor as unknown as Record<string, unknown>;
    return { advisor: `${advisor?.first_name || ''} ${advisor?.last_name || ''}`.trim(), policy_reference: row.policy_reference, policy_number: row.policy_number_masked, insurer: row.insurer, product_type: row.product_type, percentage: row.commission_percentage, amount: row.commission_amount, status: row.commission_status, policy_effective_date: row.policy_effective_date, release_date: row.commission_release_date, payment_date: row.payment_date };
  });
}

function csvBuffer(rows: ReportRow[]): Buffer {
  const headers = rows.length ? Object.keys(rows[0]) : ['result'];
  const escape = (value: unknown) => {
    const raw = String(value ?? '');
    const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  return Buffer.from([headers.map(escape).join(','), ...rows.map((row) => headers.map((header) => escape(row[header])).join(','))].join('\r\n'), 'utf8');
}

function excelBuffer(rows: ReportRow[]): Buffer {
  const headers = rows.length ? Object.keys(rows[0]) : ['result'];
  const xmlCell = (value: unknown) => `<Cell><Data ss:Type="String">${escapeHtml(value)}</Data></Cell>`;
  const body = `<Row>${headers.map(xmlCell).join('')}</Row>${rows.map((row) => `<Row>${headers.map((header) => xmlCell(row[header])).join('')}</Row>`).join('')}`;
  return Buffer.from(`<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Estate Nest"><Table>${body}</Table></Worksheet></Workbook>`, 'utf8');
}

function pdfBuffer(title: string, rows: ReportRow[]): Buffer {
  const ascii = (value: unknown) => String(value ?? '').normalize('NFKD').replace(/[^\x20-\x7E]/g, '').replace(/([\\()])/g, '\\$1');
  const lines = [title, `Generated: ${new Date().toISOString()}`, `Rows: ${rows.length}`, '', ...rows.slice(0, 35).map((row) => Object.values(row).map(ascii).join(' | ').slice(0, 110))];
  const stream = `BT /F1 9 Tf 42 760 Td 13 TL ${lines.map((line) => `(${ascii(line)}) Tj T*`).join(' ')} ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let output = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(output)); output += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(output);
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(output, 'ascii');
}

function normalizedReportFilters(value: unknown): Record<string, string> {
  const input = typeof value === 'object' && value ? value as Record<string, unknown> : {};
  const stage = text(input.stage, 50)?.toUpperCase();
  const source = text(input.source, 50)?.toUpperCase();
  return { ...(stage ? { stage } : {}), ...(source ? { source } : {}) };
}

function reportFiltersMatch(left: unknown, right: Record<string, string>): boolean {
  const normalizedLeft = normalizedReportFilters(left);
  return normalizedLeft.stage === right.stage && normalizedLeft.source === right.source;
}

async function handleReports(req: VercelRequest, res: VercelResponse, user: SessionUser) {
  if (!requirePrivilege(user, res)) return;
  const supabase = getSupabaseAdmin();
  if (req.method === 'GET') {
    const [definitions, runs] = await Promise.all([
      supabase.from('report_definitions').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('report_runs').select('*').order('created_at', { ascending: false }).limit(100),
    ]);
    if (definitions.error) throw definitions.error;
    if (runs.error) throw runs.error;
    return res.status(200).json({ success: true, definitions: definitions.data || [], runs: runs.data || [] });
  }
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const body = req.body || {};
  const action = String(body.action || 'PREVIEW').toUpperCase();
  const reportType = String(body.reportType || 'LEADS').toUpperCase();
  const format = String(body.format || 'CSV').toUpperCase();
  const filters = normalizedReportFilters(body.filters);
  if (!['PREVIEW', 'EXPORT', 'SEND', 'SCHEDULE'].includes(action)) return res.status(400).json({ message: 'Unsupported report action.' });
  if (!REPORT_TYPES.has(reportType) || !REPORT_FORMATS.has(format)) return res.status(400).json({ message: 'Select a valid report type and format.' });

  if (action === 'PREVIEW') {
    const rows = await reportRows(reportType, filters);
    const { data: run, error } = await supabase.from('report_runs').insert({
      report_type: reportType, filters, export_format: format, row_count: rows.length,
      delivery_status: 'PREVIEWED', created_by: user.id,
    }).select().single();
    if (error) throw error;
    await writeAudit(user, 'PREVIEW', 'report', run.id, { reportType, format, filters, rowCount: rows.length });
    return res.status(200).json({ success: true, previewRunId: run.id, reportType, format, rowCount: rows.length, rows: rows.slice(0, 100) });
  }

  const previewRunId = text(body.previewRunId, 100);
  if (!previewRunId) return res.status(400).json({ message: 'Preview this exact report before continuing.' });
  const { data: preview, error: previewError } = await supabase.from('report_runs')
    .select('id, report_type, export_format, filters, delivery_status, created_at')
    .eq('id', previewRunId)
    .eq('created_by', user.id)
    .maybeSingle();
  if (previewError) throw previewError;
  const previewTimestamp = preview?.created_at ? new Date(preview.created_at).getTime() : Number.NaN;
  const previewAge = Number.isFinite(previewTimestamp) ? Date.now() - previewTimestamp : Number.POSITIVE_INFINITY;
  if (!preview || preview.delivery_status !== 'PREVIEWED' || preview.report_type !== reportType || preview.export_format !== format || !reportFiltersMatch(preview.filters, filters) || previewAge > 2 * 60 * 60 * 1000) {
    return res.status(409).json({ message: 'The report changed or its preview expired. Run a new preview.' });
  }

  if (action === 'SCHEDULE') {
    const name = text(body.name, 255);
    const scheduleExpression = text(body.scheduleExpression, 100);
    const recipients = normalizeEmailAddresses(body.recipients).filter((email) => REPORT_RECIPIENTS.has(email));
    if (body.confirm !== true || !name || !scheduleExpression || !recipients.length) {
      return res.status(400).json({ message: 'Confirmed report name, schedule, preview, and approved recipient are required.' });
    }
    const approvedAt = new Date().toISOString();
    const { data, error } = await supabase.from('report_definitions').insert({
      name, report_type: reportType, filters, export_format: format, recipients,
      schedule_expression: scheduleExpression, schedule_enabled: false,
      schedule_approved_by: user.id, schedule_approved_at: approvedAt,
      created_by: user.id, updated_by: user.id,
    }).select().single();
    if (error) throw error;
    await writeAudit(user, 'SCHEDULE_APPROVED', 'report_definition', data.id, { previewRunId, reportType, format, filters, recipients, automaticDeliveryActive: false });
    return res.status(201).json({ success: true, definition: data, automaticDeliveryActive: false, message: 'Approved schedule saved. Automatic delivery remains inactive until the separate scheduler release is approved.' });
  }

  const rows = await reportRows(reportType, filters);
  if (action === 'SEND') {
    const recipient = String(body.recipient || '').trim().toLowerCase();
    if (body.confirm !== true) return res.status(400).json({ message: 'Explicit confirmation is required before report delivery.' });
    if (!REPORT_RECIPIENTS.has(recipient)) return res.status(400).json({ message: 'Select an approved Estate Nest report recipient.' });
    const { data: run, error: runError } = await supabase.from('report_runs').insert({
      report_type: reportType, filters, export_format: format, recipient, row_count: rows.length,
      delivery_status: 'QUEUED', created_by: user.id,
    }).select().single();
    if (runError) throw runError;
    const result = await sendGmailMessage({
      to: [recipient], bcc: await defaultBcc(), subject: `Estate Nest ${reportType.toLowerCase()} report summary`,
      html: `<h1>${escapeHtml(reportType)} report</h1><p>${rows.length} matching records.</p><p>Open the authenticated management portal to review or export the full report.</p>`,
      text: `${reportType} report\n${rows.length} matching records.\nOpen the authenticated management portal to review or export the full report.`,
    });
    const deliveryStatus = result.success ? 'SENT' : 'FAILED';
    const { error: updateError } = await supabase.from('report_runs').update({ delivery_status: deliveryStatus, error_message: result.errorMessage || null }).eq('id', run.id);
    if (updateError) throw updateError;
    await writeAudit(user, 'SEND', 'report', run.id, { previewRunId, reportType, format, filters, recipient, rowCount: rows.length, deliveryStatus });
    return res.status(result.success ? 200 : 502).json({ success: result.success, status: deliveryStatus, message: result.errorMessage });
  }

  const { data: run, error: runError } = await supabase.from('report_runs').insert({
    report_type: reportType, filters, export_format: format, row_count: rows.length,
    delivery_status: 'EXPORTED', created_by: user.id,
  }).select().single();
  if (runError) throw runError;
  await writeAudit(user, 'EXPORT', 'report', run.id, { previewRunId, reportType, format, filters, rowCount: rows.length, deliveryStatus: 'EXPORTED' });
  const file = format === 'CSV' ? csvBuffer(rows) : format === 'EXCEL' ? excelBuffer(rows) : pdfBuffer(`Estate Nest ${reportType} Report`, rows);
  const contentType = format === 'CSV' ? 'text/csv; charset=utf-8' : format === 'EXCEL' ? 'application/vnd.ms-excel' : 'application/pdf';
  const extension = format === 'CSV' ? 'csv' : format === 'EXCEL' ? 'xls' : 'pdf';
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="estate-nest-${reportType.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.${extension}"`);
  return res.status(200).send(file);
}

async function handleReminderRules(req: VercelRequest, res: VercelResponse, user: SessionUser) {
  const supabase = getSupabaseAdmin();
  const id = queryValue(req, 'id') || text(req.body?.id, 100);
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('compliance_reminder_rules').select('*').order('province').order('licence_type').limit(500);
    if (error) throw error;
    return res.status(200).json({ success: true, rules: data || [] });
  }
  if (!requirePrivilege(user, res)) return;
  if (!['POST', 'PATCH'].includes(req.method || '')) return res.status(405).json({ message: 'Method not allowed' });
  if (req.method === 'PATCH' && !id) return res.status(400).json({ message: 'Reminder rule id is required.' });
  const body = req.body || {};
  const province = text(body.province, 50);
  const licenceType = text(body.licenceType, 100);
  const deadline = text(body.deadlineRule, 1000);
  if (req.method === 'POST' && (!province || !licenceType || !deadline)) return res.status(400).json({ message: 'Province, licence type, and verified deadline rule are required.' });
  const requestedDays = Array.isArray(body.reminderDays) ? body.reminderDays.map(Number).filter((day: number) => [90, 60, 30, 7].includes(day)) : [90, 60, 30, 7];
  const record: Record<string, unknown> = { updated_by: user.id, reminder_days: Array.from(new Set(requestedDays)) };
  const fields: Array<[string, string, number]> = [
    ['province', 'province', 50], ['licenceType', 'licence_type', 100], ['deadlineRule', 'deadline_rule', 1000],
    ['regulator', 'regulator', 255], ['mga', 'mga', 255], ['insuranceCompany', 'insurance_company', 255],
    ['apexaRequirement', 'apexa_requirement', 2000], ['requiredDocuments', 'required_documents', 5000],
  ];
  fields.forEach(([input, column, maximum]) => { if (body[input] !== undefined) record[column] = text(body[input], maximum); });
  if (body.isActive !== undefined) record.is_active = Boolean(body.isActive);
  if (body.enableAutomaticScheduling === true) {
    return res.status(409).json({ message: 'Automatic reminder scheduling remains disabled until the separate message-preview and approval release is complete.' });
  }
  if (body.enableAutomaticScheduling === false) {
    Object.assign(record, { automatic_scheduling_enabled: false, scheduling_approved_by: null, scheduling_approved_at: null });
  }
  if (req.method === 'POST') record.created_by = user.id;
  const query = req.method === 'POST' ? supabase.from('compliance_reminder_rules').insert(record) : supabase.from('compliance_reminder_rules').update(record).eq('id', id!);
  const { data, error } = await query.select().single();
  if (error) throw error;
  await writeAudit(user, req.method === 'POST' ? 'CREATE' : 'UPDATE', 'compliance_reminder_rule', data.id, { automaticScheduling: Boolean(record.automatic_scheduling_enabled) });
  return res.status(req.method === 'POST' ? 201 : 200).json({ success: true, rule: data });
}

async function handleManagementSettings(req: VercelRequest, res: VercelResponse, user: SessionUser) {
  if (req.method === 'GET') return res.status(200).json({ success: true, email: { defaultBcc: await defaultBcc() } });
  if (req.method !== 'PATCH') return res.status(405).json({ message: 'Method not allowed' });
  if (!requirePrivilege(user, res)) return;
  const addresses = normalizeEmailAddresses(req.body?.defaultBcc);
  if (!addresses.length) return res.status(400).json({ message: 'At least one valid default BCC address is required.' });
  const { error } = await getSupabaseAdmin().from('management_settings').upsert({ setting_key: 'email.default_bcc', setting_value: { addresses }, updated_by: user.id });
  if (error) throw error;
  await writeAudit(user, 'UPDATE', 'management_setting', undefined, { settingKey: 'email.default_bcc', count: addresses.length });
  return res.status(200).json({ success: true, email: { defaultBcc: addresses } });
}

export async function handleManagementModule(
  req: VercelRequest,
  res: VercelResponse,
  user: SessionUser,
  resource: string,
): Promise<boolean> {
  if (resource === 'advisors') await handleAdvisors(req, res, user);
  else if (resource === 'compliance') await handleCompliance(req, res, user);
  else if (resource === 'carriers') await handleCarriers(req, res, user);
  else if (resource === 'advisor-contracts') await handleAdvisorContracts(req, res, user);
  else if (resource === 'commissions') await handleCommissions(req, res, user);
  else if (resource === 'notifications') await handleNotifications(req, res, user);
  else if (resource === 'emails') await handleEmails(req, res, user);
  else if (resource === 'documents') await handleDocuments(req, res, user);
  else if (resource === 'reports') await handleReports(req, res, user);
  else if (resource === 'reminder-rules') await handleReminderRules(req, res, user);
  else if (resource === 'management-settings') await handleManagementSettings(req, res, user);
  else return false;
  return true;
}
