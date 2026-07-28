// Supabase Database Client for EstateNest Management System
import { createClient } from '@supabase/supabase-js';

// Types for our database schema
export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: 'ADMIN' | 'ADVISOR' | 'MARKETING';
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  province: string | null;
  city: string | null;
  preferred_contact_method: 'PHONE' | 'EMAIL' | 'TEXT' | 'EITHER';
  marketing_consent: boolean;
  consent_timestamp: string | null;
  created_at: string;
  updated_at: string;
}

export type LeadStatus = 
  | 'NEW'
  | 'ATTEMPTED_CONTACT'
  | 'CONTACTED'
  | 'APPOINTMENT_BOOKED'
  | 'NEEDS_ANALYSIS'
  | 'QUOTE_PREPARED'
  | 'QUOTE_PRESENTED'
  | 'APPLICATION_STARTED'
  | 'APPLICATION_SUBMITTED'
  | 'UNDERWRITING'
  | 'REQUIREMENTS_PENDING'
  | 'APPROVED'
  | 'POLICY_ISSUED'
  | 'POLICY_DELIVERED'
  | 'NOT_TAKEN'
  | 'LOST'
  | 'FOLLOW_UP';

export type LeadSource = 
  | 'ORGANIC_SEARCH'
  | 'GOOGLE_BUSINESS'
  | 'SOCIAL'
  | 'DIRECT'
  | 'REFERRAL'
  | 'MARBLISM'
  | 'EMAIL'
  | 'PAID_ADS'
  | 'OTHER';

export type InsuranceInterest = 
  | 'TERM_LIFE'
  | 'WHOLE_LIFE'
  | 'MORTGAGE_PROTECTION'
  | 'CRITICAL_ILLNESS'
  | 'DISABILITY'
  | 'TRAVEL'
  | 'BUSINESS'
  | 'SEGREGATED_FUNDS'
  | 'OTHER';

export interface Lead {
  id: string;
  contact_id: string | null;
  source: LeadSource;
  campaign: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  landing_page: string | null;
  insurance_interest: InsuranceInterest;
  lead_status: LeadStatus;
  lead_owner: string | null;
  lead_score: number;
  next_follow_up_at: string | null;
  last_contacted_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  contact?: Contact;
  owner?: User;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  user_id: string | null;
  activity_type: string;
  old_value: string | null;
  new_value: string | null;
  description: string | null;
  created_at: string;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  user_id: string | null;
  note: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  lead_id: string | null;
  assigned_to: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  lead?: Lead;
  assignee?: User;
}

export interface Appointment {
  id: string;
  lead_id: string;
  title: string;
  description: string | null;
  appointment_date: string;
  duration_minutes: number;
  meeting_type: string;
  meeting_link: string | null;
  advisor_id: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  lead?: Lead;
  advisor?: User;
}

export interface FunnelSubmission {
  id: string;
  lead_id: string | null;
  contact_id: string | null;
  funnel_type: string;
  source: LeadSource;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  landing_page: string | null;
  referring_url: string | null;
  submission_data: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  lead?: Lead;
  contact?: Contact;
}

export interface Session {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface ContentDraft {
  id: string;
  content_type: 'BLOG_POST' | 'SOCIAL_POST' | 'EMAIL_CAMPAIGN' | 'LANDING_PAGE' | 'AD_COPY';
  title: string;
  body: string | null;
  channel: string | null;
  source_agent: string | null;
  status: 'AI_GENERATED' | 'UNDER_REVIEW' | 'APPROVED' | 'SCHEDULED' | 'PUBLISHED' | 'REJECTED';
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  creator?: User;
  approver?: User;
}

// Initialize Supabase clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Server-side client with elevated privileges
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Client-side anonymous client (respects RLS)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

/**
 * Database helper functions
 */

// Users
export async function getUserByEmail(email: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  if (error) return null;
  return data as User;
}

export async function getUserByUsername(username: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('username', username)
    .single();
  if (error) return null;
  return data as User;
}

export async function getUserById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data as User;
}

export async function updateUserLastLogin(userId: string) {
  await supabaseAdmin
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', userId);
}

// Sessions
export async function createSession(userId: string, ipAddress?: string, userAgent?: string) {
  const { hashSessionToken, getSessionExpiry } = await import('./auth');
  const token = hashSessionToken(require('crypto').randomBytes(32).toString('base64url'));
  
  const { data, error } = await supabaseAdmin
    .from('sessions')
    .insert({
      user_id: userId,
      token_hash: token,
      expires_at: getSessionExpiry().toISOString(),
      ip_address: ipAddress,
      user_agent: userAgent,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getSessionByToken(token: string) {
  const { hashSessionToken } = await import('./auth');
  const tokenHash = hashSessionToken(token);
  
  const { data, error } = await supabaseAdmin
    .from('sessions')
    .select('*, user:users(*)')
    .eq('token_hash', tokenHash)
    .gt('expires_at', new Date().toISOString())
    .single();
  
  if (error) return null;
  return data;
}

export async function deleteSession(sessionId: string) {
  await supabaseAdmin
    .from('sessions')
    .delete()
    .eq('id', sessionId);
}

export async function deleteAllUserSessions(userId: string) {
  await supabaseAdmin
    .from('sessions')
    .delete()
    .eq('user_id', userId);
}

// Login attempts logging
export async function logLoginAttempt(email: string, ip: string, success: boolean) {
  await supabaseAdmin
    .from('login_attempts')
    .insert({
      email,
      ip_address: ip,
      success,
    });
}

// Leads
export async function createLead(lead: Partial<Lead>) {
  const { data, error } = await supabaseAdmin
    .from('leads')
    .insert(lead)
    .select()
    .single();
  
  if (error) throw error;
  return data as Lead;
}

export async function getLeadById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('leads')
    .select('*, contact:contacts(*), owner:users(*)')
    .eq('id', id)
    .single();
  
  if (error) return null;
  return data as Lead;
}

export async function updateLead(id: string, updates: Partial<Lead>) {
  const { data, error } = await supabaseAdmin
    .from('leads')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Lead;
}

export async function getLeads(filters?: {
  status?: LeadStatus;
  source?: LeadSource;
  owner?: string;
  limit?: number;
  offset?: number;
}) {
  let query = supabaseAdmin
    .from('leads')
    .select('*, contact:contacts(*), owner:users(*)', { count: 'exact' });
  
  if (filters?.status) {
    query = query.eq('lead_status', filters.status);
  }
  if (filters?.source) {
    query = query.eq('source', filters.source);
  }
  if (filters?.owner) {
    query = query.eq('lead_owner', filters.owner);
  }
  
  query = query.order('created_at', { ascending: false });
  
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
  }
  
  const { data, error, count } = await query;
  if (error) throw error;
  return { leads: data as Lead[], total: count || 0 };
}

export async function getLeadsNeedingFollowUp() {
  const { data, error } = await supabaseAdmin
    .from('leads')
    .select('*, contact:contacts(*), owner:users(*)')
    .neq('lead_status', 'POLICY_DELIVERED')
    .neq('lead_status', 'LOST')
    .neq('lead_status', 'NOT_TAKEN')
    .lte('next_follow_up_at', new Date().toISOString())
    .order('next_follow_up_at', { ascending: true });
  
  if (error) throw error;
  return data as Lead[];
}

// Contacts
export async function createContact(contact: Partial<Contact>) {
  const { data, error } = await supabaseAdmin
    .from('contacts')
    .insert(contact)
    .select()
    .single();
  
  if (error) throw error;
  return data as Contact;
}

export async function getContactById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('contacts')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) return null;
  return data as Contact;
}

export async function findOrCreateContact(contact: Partial<Contact>) {
  // Try to find existing contact by email or phone
  if (contact.email) {
    const { data: existing } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('email', contact.email)
      .single();
    
    if (existing) return { contact: existing as Contact, created: false };
  }
  
  // Create new contact
  return createContact(contact).then(contact => ({ contact, created: true }));
}

// Lead Activities
export async function createLeadActivity(activity: {
  lead_id: string;
  user_id?: string;
  activity_type: string;
  old_value?: string;
  new_value?: string;
  description?: string;
}) {
  const { data, error } = await supabaseAdmin
    .from('lead_activities')
    .insert(activity)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Lead Notes
export async function createLeadNote(note: { lead_id: string; user_id?: string; note: string }) {
  const { data, error } = await supabaseAdmin
    .from('lead_notes')
    .insert(note)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Dashboard Stats
export async function getDashboardStats() {
  const now = new Date();
  const startOfToday = new Date(now.setHours(0, 0, 0, 0)).toISOString();
  const startOfWeek = new Date(now.setDate(now.getDate() - 7)).toISOString();
  
  // Get counts by status
  const { count: newLeads } = await supabaseAdmin
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('lead_status', 'NEW');
  
  const { count: needsFollowUp } = await supabaseAdmin
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .lte('next_follow_up_at', now.toISOString())
    .neq('lead_status', 'POLICY_DELIVERED')
    .neq('lead_status', 'LOST');
  
  const { count: todaysAppointments } = await supabaseAdmin
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .gte('appointment_date', startOfToday)
    .lt('appointment_date', new Date().toISOString());
  
  // Get leads by source
  const { data: leadsBySource } = await supabaseAdmin
    .from('leads')
    .select('source')
    .gte('created_at', startOfWeek);
  
  const sourceCounts: Record<string, number> = {};
  leadsBySource?.forEach(lead => {
    sourceCounts[lead.source] = (sourceCounts[lead.source] || 0) + 1;
  });
  
  // Get pipeline summary
  const { data: pipelineSummary } = await supabaseAdmin
    .from('leads')
    .select('lead_status');
  
  const statusCounts: Record<string, number> = {};
  pipelineSummary?.forEach(lead => {
    statusCounts[lead.lead_status] = (statusCounts[lead.lead_status] || 0) + 1;
  });
  
  return {
    newLeads: newLeads || 0,
    needsFollowUp: needsFollowUp || 0,
    todaysAppointments: todaysAppointments || 0,
    leadsBySource: sourceCounts,
    pipelineStatus: statusCounts,
  };
}

// Funnel Submissions
export async function createFunnelSubmission(submission: Partial<FunnelSubmission>) {
  const { data, error } = await supabaseAdmin
    .from('funnel_submissions')
    .insert(submission)
    .select()
    .single();
  
  if (error) throw error;
  return data as FunnelSubmission;
}

// Tasks
export async function getTasks(filters?: {
  assigned_to?: string;
  status?: string;
  lead_id?: string;
}) {
  let query = supabaseAdmin
    .from('tasks')
    .select('*, lead:leads(*), assignee:users(*)');
  
  if (filters?.assigned_to) {
    query = query.eq('assigned_to', filters.assigned_to);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.lead_id) {
    query = query.eq('lead_id', filters.lead_id);
  }
  
  query = query.order('due_date', { ascending: true, nullsFirst: false });
  
  const { data, error } = await query;
  if (error) throw error;
  return data as Task[];
}

export async function createTask(task: Partial<Task>) {
  const { data, error } = await supabaseAdmin
    .from('tasks')
    .insert(task)
    .select()
    .single();
  
  if (error) throw error;
  return data as Task;
}

export async function updateTask(id: string, updates: Partial<Task>) {
  const { data, error } = await supabaseAdmin
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Task;
}

// Appointments
export async function getAppointments(filters?: {
  advisor_id?: string;
  date?: string;
  lead_id?: string;
}) {
  let query = supabaseAdmin
    .from('appointments')
    .select('*, lead:leads(*), advisor:users(*)');
  
  if (filters?.advisor_id) {
    query = query.eq('advisor_id', filters.advisor_id);
  }
  if (filters?.date) {
    query = query.gte('appointment_date', filters.date)
      .lt('appointment_date', new Date(new Date(filters.date).getTime() + 86400000).toISOString());
  }
  if (filters?.lead_id) {
    query = query.eq('lead_id', filters.lead_id);
  }
  
  query = query.order('appointment_date', { ascending: true });
  
  const { data, error } = await query;
  if (error) throw error;
  return data as Appointment[];
}

// Content Drafts
export async function getContentDrafts(filters?: {
  status?: string;
  content_type?: string;
  created_by?: string;
}) {
  let query = supabaseAdmin
    .from('content_drafts')
    .select('*, creator:users!created_by(*), approver:users!approved_by(*)');
  
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.content_type) {
    query = query.eq('content_type', filters.content_type);
  }
  if (filters?.created_by) {
    query = query.eq('created_by', filters.created_by);
  }
  
  query = query.order('created_at', { ascending: false });
  
  const { data, error } = await query;
  if (error) throw error;
  return data as ContentDraft[];
}

export async function updateContentDraft(id: string, updates: Partial<ContentDraft>) {
  const { data, error } = await supabaseAdmin
    .from('content_drafts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as ContentDraft;
}

// Audit Log
export async function createAuditLog(log: {
  user_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  ip_address?: string;
  user_agent?: string;
}) {
  const { data, error } = await supabaseAdmin
    .from('audit_log')
    .insert(log)
    .select()
    .single();
  
  if (error) console.error('Audit log error:', error);
  return data;
}
