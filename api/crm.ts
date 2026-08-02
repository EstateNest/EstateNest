import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getManagementAuth } from './_lib/management-auth.js';
import { handleManagementModule } from './_lib/management-modules.js';
import { isTrustedOrigin, type SessionUser } from './_lib/session.js';
import { getSupabaseAdmin } from './_lib/supabase.js';

const LEAD_STATUSES = new Set([
  'PROSPECT',
  'VERIFIED_LEAD',
  'CONTACTED',
  'APPOINTMENT_BOOKED',
  'NEEDS_ANALYSIS',
  'QUOTE_PREPARED',
  'QUOTE_PRESENTED',
  'APPLICATION_STARTED',
  'APPLICATION_SUBMITTED',
  'UNDERWRITING',
  'APPROVED',
  'POLICY_ISSUED',
  'POLICY_DELIVERED',
  'ACTIVE_CLIENT',
  'FOLLOW_UP_PROSPECT',
  'DEFERRED',
  'NOT_CONVERTED',
  'DUPLICATE',
  'INVALID_LEAD',
  'ARCHIVED',
]);

const FOLLOW_UP_OUTCOMES = new Set(['FOLLOW_UP_PROSPECT', 'DEFERRED', 'NOT_CONVERTED']);
const FUTURE_CONTACT_STATUSES = new Set(['CONSENTED', 'DECLINED', 'UNKNOWN']);
const LEGACY_LEAD_STATUS: Record<string, string> = {
  PROSPECT: 'NEW', VERIFIED_LEAD: 'CONTACTED', CONTACTED: 'CONTACTED',
  APPOINTMENT_BOOKED: 'APPOINTMENT_BOOKED', NEEDS_ANALYSIS: 'NEEDS_ANALYSIS',
  QUOTE_PREPARED: 'QUOTE_PREPARED', QUOTE_PRESENTED: 'QUOTE_PRESENTED',
  APPLICATION_STARTED: 'APPLICATION_STARTED', APPLICATION_SUBMITTED: 'APPLICATION_SUBMITTED',
  UNDERWRITING: 'UNDERWRITING', APPROVED: 'APPROVED', POLICY_ISSUED: 'POLICY_ISSUED',
  POLICY_DELIVERED: 'POLICY_DELIVERED', ACTIVE_CLIENT: 'POLICY_DELIVERED',
  FOLLOW_UP_PROSPECT: 'FOLLOW_UP', DEFERRED: 'FOLLOW_UP', NOT_CONVERTED: 'LOST',
  DUPLICATE: 'LOST', INVALID_LEAD: 'LOST', ARCHIVED: 'LOST',
};

const INSURANCE_INTERESTS = new Set([
  'TERM_LIFE',
  'WHOLE_LIFE',
  'MORTGAGE_PROTECTION',
  'CRITICAL_ILLNESS',
  'DISABILITY',
  'TRAVEL',
  'BUSINESS',
  'SEGREGATED_FUNDS',
  'OTHER',
]);

const LEAD_SOURCES = new Set([
  'ORGANIC_SEARCH',
  'GOOGLE_BUSINESS',
  'SOCIAL',
  'DIRECT',
  'REFERRAL',
  'MARBLISM',
  'EMAIL',
  'PAID_ADS',
  'CHATBOT',
  'OTHER',
]);

function queryValue(req: VercelRequest, key: string): string {
  const value = req.query[key];
  return Array.isArray(value) ? value[0] || '' : value || '';
}
function safeLimit(value: string, fallback = 100, maximum = 500): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), maximum) : fallback;
}

function text(value: unknown, maximum = 1000): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return String(value).trim().slice(0, maximum) || null;
}

function isAdmin(user: SessionUser): boolean {
  return ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user.role.toUpperCase());
}

function ensureAdmin(user: SessionUser, res: VercelResponse): boolean {
  if (!isAdmin(user)) {
    res.status(403).json({ message: 'Administrator access is required' });
    return false;
  }

  return true;
}

async function audit(user: SessionUser, action: string, entityType: string, entityId?: string, metadata?: Record<string, unknown>) {
  try {
    const databaseUserId = user.profileId || null;
    await getSupabaseAdmin().from('audit_log').insert({
      user_id: databaseUserId,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      actor_auth_user_id: user.id,
      metadata: metadata || {},
    });
  } catch {
    console.error('Management audit write failed');
    return;
  }
}

function presentLead<T extends { pipeline_stage?: string | null; lead_status?: string | null }>(lead: T): T & { lead_status: string } {
  return { ...lead, lead_status: lead.pipeline_stage || lead.lead_status || 'PROSPECT' };
}

function validDateTime(value: unknown): string | null {
  const normalized = text(value, 100);
  if (!normalized) return null;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function getDashboard(res: VercelResponse) {
  const supabase = getSupabaseAdmin();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
  const dayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).toISOString();

  const [newLeadsResult, contactsResult, appointmentsResult, leadsResult, recentResult, followUpResult] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true }).is('archived_at', null).gte('created_at', sevenDaysAgo),
    supabase.from('contacts').select('*', { count: 'exact', head: true }).is('archived_at', null),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).gte('appointment_date', dayStart).lt('appointment_date', dayEnd),
    supabase.from('leads').select('lead_status, pipeline_stage, source, created_at').is('archived_at', null).order('created_at', { ascending: false }).limit(5000),
    supabase.from('leads').select('*, contact:contacts(*)').is('archived_at', null).order('created_at', { ascending: false }).limit(6),
    supabase.from('leads').select('*, contact:contacts(*)', { count: 'exact' }).is('archived_at', null).not('next_follow_up_at', 'is', null).lte('next_follow_up_at', now.toISOString()).order('next_follow_up_at', { ascending: true }).limit(8),
  ]);

  const firstError = [newLeadsResult, contactsResult, appointmentsResult, leadsResult, recentResult, followUpResult]
    .find((result) => result.error)?.error;

  if (firstError) {
    throw firstError;
  }

  const allLeads = leadsResult.data || [];
  const pipelineStatus = allLeads.reduce<Record<string, number>>((accumulator, lead) => {
    const stage = lead.pipeline_stage || lead.lead_status || 'PROSPECT';
    accumulator[stage] = (accumulator[stage] || 0) + 1;
    return accumulator;
  }, {});
  const leadsBySource = allLeads.reduce<Record<string, number>>((accumulator, lead) => {
    accumulator[lead.source] = (accumulator[lead.source] || 0) + 1;
    return accumulator;
  }, {});
  const completedLeads = allLeads.filter((lead) => ['POLICY_ISSUED', 'POLICY_DELIVERED', 'ACTIVE_CLIENT'].includes(lead.pipeline_stage || lead.lead_status)).length;
  const followUpLeads = (followUpResult.data || []).map(presentLead);

  return res.status(200).json({
    success: true,
    stats: {
      newLeads: newLeadsResult.count || 0,
      needsFollowUp: followUpResult.count || 0,
      todaysAppointments: appointmentsResult.count || 0,
      totalContacts: contactsResult.count || 0,
      totalLeads: allLeads.length,
      completedLeads,
      conversionRate: allLeads.length ? Number(((completedLeads / allLeads.length) * 100).toFixed(1)) : 0,
      pipelineStatus,
      leadsBySource,
    },
    recentLeads: (recentResult.data || []).map(presentLead),
    followUpLeads,
  });
}

async function getLeads(req: VercelRequest, res: VercelResponse) {
  const supabase = getSupabaseAdmin();
  const id = queryValue(req, 'id');

  if (id) {
    const { data, error } = await supabase
      .from('leads')
      .select('*, contact:contacts(*), owner:users(id, first_name, last_name, email), notes:lead_notes(*), activities:lead_activities(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? res.status(200).json({ success: true, lead: presentLead(data) }) : res.status(404).json({ message: 'Lead not found' });
  }

  const limit = safeLimit(queryValue(req, 'limit'), 200);
  const status = queryValue(req, 'status').toUpperCase();
  const source = queryValue(req, 'source').toUpperCase();
  const archived = queryValue(req, 'archived').toLowerCase() === 'true' || status === 'ARCHIVED';
  let query = supabase
    .from('leads')
    .select('*, contact:contacts(*), owner:users(id, first_name, last_name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(limit);

  query = archived ? query.not('archived_at', 'is', null) : query.is('archived_at', null);
  if (LEAD_STATUSES.has(status) && status !== 'ARCHIVED') query = query.eq('pipeline_stage', status);
  if (LEAD_SOURCES.has(source)) query = query.eq('source', source);

  const { data, error, count } = await query;
  if (error) throw error;

  return res.status(200).json({ success: true, leads: (data || []).map(presentLead), total: count || 0 });
}

async function createLead(req: VercelRequest, res: VercelResponse, user: SessionUser) {
  const supabase = getSupabaseAdmin();
  const body = req.body || {};
  let contactId = text(body.contactId, 100);

  if (!contactId) {
    const firstName = text(body.firstName, 100);
    const lastName = text(body.lastName, 100);
    const email = text(body.email, 255)?.toLowerCase() || null;
    const phone = text(body.phone, 50);

    if (!firstName || !lastName || (!email && !phone)) {
      return res.status(400).json({ message: 'A name and either an email or phone number are required' });
    }

    if (email) {
      const existingContact = await supabase.from('contacts').select('id').is('archived_at', null).ilike('email', email).maybeSingle();
      contactId = existingContact.data?.id || null;
    }

    if (!contactId) {
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          alternate_phone: text(body.alternatePhone, 50),
          address: text(body.address, 1000),
          province: text(body.province, 50),
          city: text(body.city, 100),
          postal_code: text(body.postalCode, 20),
          lead_source: LEAD_SOURCES.has(String(body.source || '').toUpperCase()) ? String(body.source).toUpperCase() : 'DIRECT',
          assigned_advisor_id: text(body.assignedAdvisorId, 100),
          preferred_contact_method: text(body.preferredContactMethod, 20) || 'EITHER',
          marketing_consent: Boolean(body.marketingConsent),
          consent_timestamp: body.marketingConsent ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (contactError) throw contactError;
      contactId = contact.id;
    }
  }

  const insuranceInterest = String(body.insuranceInterest || '').toUpperCase();
  const source = String(body.source || 'DIRECT').toUpperCase();

  if (!INSURANCE_INTERESTS.has(insuranceInterest)) {
    return res.status(400).json({ message: 'Select a valid insurance interest' });
  }

  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      contact_id: contactId,
      source: LEAD_SOURCES.has(source) ? source : 'OTHER',
      insurance_interest: insuranceInterest,
      lead_status: 'NEW',
      pipeline_stage: 'PROSPECT',
      assigned_advisor_id: text(body.assignedAdvisorId, 100),
      lead_score: Number.isFinite(Number(body.leadScore)) ? Math.min(Math.max(Number(body.leadScore), 0), 100) : 50,
      notes: text(body.notes, 5000),
      next_follow_up_at: validDateTime(body.nextFollowUpAt),
      campaign: text(body.campaign, 255),
    })
    .select('*, contact:contacts(*)')
    .single();

  if (error) throw error;
  await audit(user, 'CREATE', 'lead', lead.id);
  return res.status(201).json({ success: true, lead: presentLead(lead) });
}

async function updateLead(req: VercelRequest, res: VercelResponse, user: SessionUser) {
  const id = queryValue(req, 'id') || text(req.body?.id, 100);

  if (!id) return res.status(400).json({ message: 'Lead id is required' });

  const body = req.body || {};
  const updates: Record<string, unknown> = {};
  const status = String(body.leadStatus || '').toUpperCase();
  let lifecycleAction: 'RESTORE' | null = null;
  let lifecycleReason: string | null = null;

  if (String(body.action || '').toUpperCase() === 'RESTORE') {
    if (!ensureAdmin(user, res)) return;
    const reason = text(body.reason, 1000);
    if (!reason) return res.status(400).json({ message: 'A restore reason is required' });
    lifecycleAction = 'RESTORE';
    lifecycleReason = reason;
    const restoreStage = String(body.restoreStage || 'PROSPECT').toUpperCase();
    updates.archived_at = null;
    updates.archived_reason = null;
    updates.archived_by = null;
    updates.pipeline_stage = LEAD_STATUSES.has(restoreStage) && restoreStage !== 'ARCHIVED' ? restoreStage : 'PROSPECT';
    updates.lead_status = LEGACY_LEAD_STATUS[String(updates.pipeline_stage)] || 'NEW';
  }

  if (status && LEAD_STATUSES.has(status) && status !== 'ARCHIVED') {
    if (FOLLOW_UP_OUTCOMES.has(status)) {
      const reason = text(body.reason, 2000);
      const nextFollowUpAt = validDateTime(body.nextFollowUpAt);
      const assignedAdvisorId = text(body.assignedAdvisorId, 100);
      const consent = String(body.futureContactConsent || '').toUpperCase();
      const stageNotes = text(body.stageNotes, 5000);
      if (!reason || !nextFollowUpAt || !assignedAdvisorId || !FUTURE_CONTACT_STATUSES.has(consent) || !stageNotes) {
        return res.status(400).json({ message: 'Reason, next follow-up date, assigned advisor, future-contact consent, and notes are required for this outcome' });
      }
      updates.outcome_reason = reason;
      updates.next_follow_up_at = nextFollowUpAt;
      updates.assigned_advisor_id = assignedAdvisorId;
      updates.future_contact_consent = consent;
      updates.stage_notes = stageNotes;
    }
    updates.pipeline_stage = status;
    updates.lead_status = LEGACY_LEAD_STATUS[status] || 'NEW';
    updates.stage_changed_at = new Date().toISOString();
    updates.stage_changed_by = user.id;
  }
  if (body.leadScore !== undefined) {
    const leadScore = Number(body.leadScore);
    if (!Number.isFinite(leadScore)) return res.status(400).json({ message: 'Lead score must be a number from 0 to 100' });
    updates.lead_score = Math.min(Math.max(leadScore, 0), 100);
  }
  if (body.notes !== undefined) updates.notes = text(body.notes, 5000);
  if (body.nextFollowUpAt !== undefined && !FOLLOW_UP_OUTCOMES.has(status)) updates.next_follow_up_at = validDateTime(body.nextFollowUpAt);
  if (body.assignedAdvisorId !== undefined && !FOLLOW_UP_OUTCOMES.has(status)) updates.assigned_advisor_id = text(body.assignedAdvisorId, 100);
  if (body.lastContactAt !== undefined) updates.last_contacted_at = validDateTime(body.lastContactAt);

  if (!Object.keys(updates).length) {
    return res.status(400).json({ message: 'No valid lead changes were supplied' });
  }

  const supabase = getSupabaseAdmin();
  const { data: current } = await supabase.from('leads').select('lead_status, pipeline_stage').eq('id', id).maybeSingle();
  const { data, error } = await supabase.from('leads').update(updates).eq('id', id).select('*, contact:contacts(*)').single();
  if (error) throw error;

  if (updates.pipeline_stage && current?.pipeline_stage !== updates.pipeline_stage) {
    await supabase.from('lead_activities').insert({
      lead_id: id,
      user_id: user.profileId || null,
      activity_type: 'STATUS_CHANGE',
      old_value: current?.pipeline_stage || current?.lead_status || null,
      new_value: updates.pipeline_stage,
      description: `Stage changed to ${updates.pipeline_stage}`,
    });
  }

  await audit(user, lifecycleAction || 'UPDATE', 'lead', id, lifecycleAction ? { reason: lifecycleReason, restoredStage: updates.pipeline_stage } : updates);
  return res.status(200).json({ success: true, lead: presentLead(data) });
}

async function deleteLead(req: VercelRequest, res: VercelResponse, user: SessionUser) {
  if (!ensureAdmin(user, res)) return;
  const id = queryValue(req, 'id') || text(req.body?.id, 100);
  if (!id) return res.status(400).json({ message: 'Lead id is required' });

  const reason = text(req.body?.reason, 2000);
  if (!reason) return res.status(400).json({ message: 'An archive reason is required' });
  const archivedAt = new Date().toISOString();
  const { data, error } = await getSupabaseAdmin().from('leads').update({
    archived_at: archivedAt,
    archived_reason: reason,
    archived_by: user.id,
    pipeline_stage: 'ARCHIVED',
    lead_status: 'LOST',
    stage_changed_at: archivedAt,
    stage_changed_by: user.id,
  }).eq('id', id).select('id').maybeSingle();
  if (error) throw error;
  if (!data) return res.status(404).json({ message: 'Lead not found' });
  await audit(user, 'ARCHIVE', 'lead', id, { reason });
  return res.status(200).json({ success: true });
}

async function getContacts(req: VercelRequest, res: VercelResponse) {
  const supabase = getSupabaseAdmin();
  const id = queryValue(req, 'id');

  if (id) {
    const { data, error } = await supabase.from('contacts').select('*, leads(*)').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? res.status(200).json({ success: true, contact: { ...data, leads: (data.leads || []).map(presentLead) } }) : res.status(404).json({ message: 'Contact not found' });
  }

  const limit = safeLimit(queryValue(req, 'limit'), 300);
  const search = queryValue(req, 'search').replace(/[,%()]/g, '').slice(0, 100);
  const archived = queryValue(req, 'archived').toLowerCase() === 'true';
  let query = supabase.from('contacts').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(limit);

  query = archived ? query.not('archived_at', 'is', null) : query.is('archived_at', null);

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return res.status(200).json({ success: true, contacts: data || [], total: count || 0 });
}

async function createContact(req: VercelRequest, res: VercelResponse, user: SessionUser) {
  const body = req.body || {};
  const firstName = text(body.firstName, 100);
  const lastName = text(body.lastName, 100);

  if (!firstName || !lastName) {
    return res.status(400).json({ message: 'First and last name are required' });
  }

  const { data, error } = await getSupabaseAdmin()
    .from('contacts')
    .insert({
      first_name: firstName,
      last_name: lastName,
      email: text(body.email, 255)?.toLowerCase() || null,
      phone: text(body.phone, 50),
      alternate_phone: text(body.alternatePhone, 50),
      address: text(body.address, 1000),
      province: text(body.province, 50),
      city: text(body.city, 100),
      postal_code: text(body.postalCode, 20),
      lead_source: text(body.leadSource, 100),
      assigned_advisor_id: text(body.assignedAdvisorId, 100),
      next_follow_up_at: validDateTime(body.nextFollowUpAt),
      preferred_contact_method: text(body.preferredContactMethod, 20) || 'EITHER',
      marketing_consent: Boolean(body.marketingConsent),
      consent_timestamp: body.marketingConsent ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) throw error;
  await audit(user, 'CREATE', 'contact', data.id);
  return res.status(201).json({ success: true, contact: data });
}

async function updateContact(req: VercelRequest, res: VercelResponse, user: SessionUser) {
  const id = queryValue(req, 'id') || text(req.body?.id, 100);
  if (!id) return res.status(400).json({ message: 'Contact id is required' });
  const body = req.body || {};
  const updates: Record<string, unknown> = {};
  let lifecycleReason: string | null = null;
  const fields: Array<[string, string, number]> = [
    ['firstName', 'first_name', 100],
    ['lastName', 'last_name', 100],
    ['email', 'email', 255],
    ['phone', 'phone', 50],
    ['alternatePhone', 'alternate_phone', 50],
    ['address', 'address', 1000],
    ['province', 'province', 50],
    ['city', 'city', 100],
    ['postalCode', 'postal_code', 20],
    ['leadSource', 'lead_source', 100],
    ['preferredContactMethod', 'preferred_contact_method', 20],
  ];

  fields.forEach(([inputKey, databaseKey, maximum]) => {
    if (body[inputKey] !== undefined) updates[databaseKey] = text(body[inputKey], maximum);
  });
  if (body.marketingConsent !== undefined) updates.marketing_consent = Boolean(body.marketingConsent);
  if (body.assignedAdvisorId !== undefined) updates.assigned_advisor_id = text(body.assignedAdvisorId, 100);
  if (body.lastContactAt !== undefined) updates.last_contact_at = validDateTime(body.lastContactAt);
  if (body.nextFollowUpAt !== undefined) updates.next_follow_up_at = validDateTime(body.nextFollowUpAt);

  if (String(body.action || '').toUpperCase() === 'RESTORE') {
    if (!ensureAdmin(user, res)) return;
    const reason = text(body.reason, 1000);
    if (!reason) return res.status(400).json({ message: 'A restore reason is required' });
    lifecycleReason = reason;
    updates.archived_at = null;
    updates.archived_reason = null;
    updates.archived_by = null;
  }

  if (!Object.keys(updates).length) return res.status(400).json({ message: 'No valid client changes were supplied' });

  const { data, error } = await getSupabaseAdmin().from('contacts').update(updates).eq('id', id).select().single();
  if (error) throw error;
  await audit(user, lifecycleReason ? 'RESTORE' : 'UPDATE', 'contact', id, lifecycleReason ? { reason: lifecycleReason } : updates);
  return res.status(200).json({ success: true, contact: data });
}

async function deleteContact(req: VercelRequest, res: VercelResponse, user: SessionUser) {
  if (!ensureAdmin(user, res)) return;
  const id = queryValue(req, 'id') || text(req.body?.id, 100);
  if (!id) return res.status(400).json({ message: 'Contact id is required' });
  const reason = text(req.body?.reason, 2000);
  if (!reason) return res.status(400).json({ message: 'An archive reason is required' });
  const { data, error } = await getSupabaseAdmin().from('contacts').update({
    archived_at: new Date().toISOString(),
    archived_reason: reason,
    archived_by: user.id,
  }).eq('id', id).select('id').maybeSingle();
  if (error) throw error;
  if (!data) return res.status(404).json({ message: 'Client not found' });
  await audit(user, 'ARCHIVE', 'contact', id, { reason });
  return res.status(200).json({ success: true });
}

async function handleCollection(req: VercelRequest, res: VercelResponse, user: SessionUser, resource: 'tasks' | 'appointments' | 'content') {
  const supabase = getSupabaseAdmin();
  const table = resource === 'content' ? 'content_drafts' : resource;
  const id = queryValue(req, 'id') || text(req.body?.id, 100);

  if (req.method === 'GET') {
    const select = resource === 'appointments'
      ? '*, lead:leads(id, insurance_interest, contact:contacts(first_name, last_name, email, phone)), advisor:users(id, first_name, last_name)'
      : resource === 'tasks'
        ? '*, lead:leads(id, insurance_interest, contact:contacts(first_name, last_name)), assignee:users(id, first_name, last_name)'
        : '*';
    const orderColumn = resource === 'appointments' ? 'appointment_date' : resource === 'tasks' ? 'due_date' : 'created_at';
    let query = supabase.from(table).select(select).order(orderColumn, { ascending: resource !== 'content', nullsFirst: false }).limit(300);
    if (id) query = query.eq('id', id);
    const { data, error } = await query;
    if (error) throw error;
    return res.status(200).json({ success: true, items: data || [] });
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    let insert: Record<string, unknown>;

    if (resource === 'tasks') {
      const title = text(body.title, 255);
      if (!title) return res.status(400).json({ message: 'Task title is required' });
      insert = {
        title,
        description: text(body.description, 5000),
        lead_id: text(body.leadId, 100),
        assigned_to: user.profileId || null,
        status: 'PENDING',
        priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(String(body.priority).toUpperCase()) ? String(body.priority).toUpperCase() : 'MEDIUM',
        due_date: text(body.dueDate, 100),
      };
    } else if (resource === 'appointments') {
      const leadId = text(body.leadId, 100);
      const appointmentDate = text(body.appointmentDate, 100);
      if (!leadId || !appointmentDate) return res.status(400).json({ message: 'Lead and appointment date are required' });
      insert = {
        lead_id: leadId,
        appointment_date: appointmentDate,
        duration_minutes: Math.min(Math.max(Number(body.durationMinutes) || 30, 15), 240),
        meeting_type: text(body.meetingType, 50) || 'PHONE',
        meeting_link: text(body.meetingLink, 500),
        advisor_id: user.profileId || null,
        status: 'SCHEDULED',
        notes: text(body.notes, 5000),
      };
    } else {
      const title = text(body.title, 255);
      if (!title) return res.status(400).json({ message: 'Content title is required' });
      insert = {
        content_type: text(body.contentType, 50) || 'SOCIAL_POST',
        title,
        body: text(body.body, 20000),
        status: 'AI_GENERATED',
        source_agent: text(body.sourceAgent, 100) || 'MANUAL',
        created_by: user.profileId || null,
      };
    }

    const { data, error } = await supabase.from(table).insert(insert).select().single();
    if (error) throw error;
    await audit(user, 'CREATE', resource, data.id);
    return res.status(201).json({ success: true, item: data });
  }

  if (req.method === 'PATCH') {
    if (!id) return res.status(400).json({ message: 'Item id is required' });
    const body = req.body || {};
    const updates: Record<string, unknown> = {};

    if (resource === 'tasks') {
      if (body.status !== undefined) updates.status = text(body.status, 30);
      if (body.priority !== undefined) updates.priority = text(body.priority, 30);
      if (body.title !== undefined) updates.title = text(body.title, 255);
      if (body.dueDate !== undefined) updates.due_date = text(body.dueDate, 100);
      if (body.status === 'COMPLETED') updates.completed_at = new Date().toISOString();
    } else if (resource === 'appointments') {
      if (body.status !== undefined) updates.status = text(body.status, 30);
      if (body.appointmentDate !== undefined) updates.appointment_date = text(body.appointmentDate, 100);
      if (body.notes !== undefined) updates.notes = text(body.notes, 5000);
    } else {
      if (body.status !== undefined) updates.status = text(body.status, 30);
      if (body.title !== undefined) updates.title = text(body.title, 255);
      if (body.body !== undefined) updates.body = text(body.body, 20000);
      if (body.status === 'PUBLISHED') updates.published_at = new Date().toISOString();
    }

    const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single();
    if (error) throw error;
    await audit(user, 'UPDATE', resource, id, updates);
    return res.status(200).json({ success: true, item: data });
  }

  if (req.method === 'DELETE') {
    if (!ensureAdmin(user, res)) return;
    if (!id) return res.status(400).json({ message: 'Item id is required' });
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
    await audit(user, 'DELETE', resource, id);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

function getIntegrations(res: VercelResponse, user: SessionUser) {
  return res.status(200).json({
    success: true,
    integrations: {
      supabase: Boolean(
        (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)
        && process.env.SUPABASE_SECRET_KEY,
      ),
      email: Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
      n8n: Boolean(process.env.N8N_WEBHOOK_URL),
      marblism: Boolean(process.env.MARBLISM_WEBHOOK_URL),
      googleAnalytics: true,
      googleTagManager: true,
      microsoftClarity: true,
    },
    user: { role: user.role, environmentManagedPassword: false },
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const auth = await getManagementAuth(req, res);
  if (auth.status === 'unauthenticated') return res.status(401).json({ message: 'Not authenticated' });
  if (auth.status === 'unauthorized') return res.status(403).json({ message: 'Management access is not authorized' });
  if (auth.status === 'mfa_required' || auth.status === 'mfa_enrollment_required') {
    return res.status(401).json({
      message: 'Additional authentication is required',
      code: auth.status === 'mfa_required' ? 'MFA_REQUIRED' : 'MFA_ENROLLMENT_REQUIRED',
    });
  }
  if (auth.status !== 'authorized' || !auth.user) return res.status(503).json({ message: 'Management authentication is unavailable' });
  const user = auth.user;
  if (req.method !== 'GET' && !isTrustedOrigin(req)) return res.status(403).json({ message: 'Invalid request origin' });

  const resource = queryValue(req, 'resource').toLowerCase();

  try {
    if (resource === 'dashboard' && req.method === 'GET') return await getDashboard(res);
    if (resource === 'leads') {
      if (req.method === 'GET') return await getLeads(req, res);
      if (req.method === 'POST') return await createLead(req, res, user);
      if (req.method === 'PATCH') return await updateLead(req, res, user);
      if (req.method === 'DELETE') return await deleteLead(req, res, user);
    }
    if (resource === 'contacts') {
      if (req.method === 'GET') return await getContacts(req, res);
      if (req.method === 'POST') return await createContact(req, res, user);
      if (req.method === 'PATCH') return await updateContact(req, res, user);
      if (req.method === 'DELETE') return await deleteContact(req, res, user);
    }
    if (resource === 'tasks' || resource === 'appointments' || resource === 'content') {
      return await handleCollection(req, res, user, resource);
    }
    if (resource === 'integrations' && req.method === 'GET') return getIntegrations(res, user);
    if (await handleManagementModule(req, res, user, resource)) return;

    return res.status(404).json({ message: 'CRM resource not found' });
  } catch (error) {
    console.error(`CRM ${resource || 'unknown'} error:`, error instanceof Error ? error.message : 'Unknown error');
    return res.status(500).json({ message: 'The management service could not complete this request' });
  }
}
