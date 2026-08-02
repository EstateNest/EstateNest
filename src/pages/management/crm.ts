export interface ManagementUser {
  id: string;
  username: string;
  email: string;
  role: string;
  firstName?: string | null;
  lastName?: string | null;
}
export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  alternate_phone?: string | null;
  address?: string | null;
  province?: string | null;
  city?: string | null;
  postal_code?: string | null;
  lead_source?: string | null;
  assigned_advisor_id?: string | null;
  last_contact_at?: string | null;
  next_follow_up_at?: string | null;
  archived_at?: string | null;
  archived_reason?: string | null;
  preferred_contact_method?: string | null;
  marketing_consent?: boolean;
  created_at: string;
  leads?: Lead[];
}

export interface Lead {
  id: string;
  public_id?: string | null;
  contact_id?: string | null;
  contact?: Contact | null;
  source: string;
  insurance_interest: string;
  lead_status: string;
  lead_score?: number;
  notes?: string | null;
  next_follow_up_at?: string | null;
  assigned_advisor_id?: string | null;
  outcome_reason?: string | null;
  future_contact_consent?: string | null;
  stage_notes?: string | null;
  last_contacted_at?: string | null;
  archived_at?: string | null;
  archived_reason?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface DashboardStats {
  newLeads: number;
  needsFollowUp: number;
  todaysAppointments: number;
  totalContacts: number;
  totalLeads: number;
  completedLeads: number;
  conversionRate: number;
  pipelineStatus: Record<string, number>;
  leadsBySource: Record<string, number>;
}

export interface DashboardResponse {
  success: boolean;
  stats: DashboardStats;
  recentLeads: Lead[];
  followUpLeads: Lead[];
}

export const leadStatuses = [
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
] as const;

export const leadOutcomeStatuses = ['FOLLOW_UP_PROSPECT', 'DEFERRED', 'NOT_CONVERTED'] as const;

export const advisorStages = [
  'ADVISOR_PROSPECT',
  'ADVISOR_LEAD',
  'INITIAL_CONTACT',
  'DISCOVERY_MEETING',
  'RECRUITMENT_REVIEW',
  'OFFER_AGREEMENT',
  'ADVISOR_RECRUITED',
  'ONBOARDING',
  'LICENSING_AND_CONTRACTING',
  'ACTIVE_ADVISOR',
  'DEFERRED',
  'NOT_PROCEEDING',
  'INACTIVE',
  'ARCHIVED',
] as const;

export interface AdvisorCompliance {
  id: string;
  advisor_id: string;
  life_licence_number?: string | null;
  accident_sickness_licence_number?: string | null;
  licence_province?: string | null;
  life_licence_expiry_date?: string | null;
  accident_sickness_expiry_date?: string | null;
  eo_policy_number?: string | null;
  eo_provider?: string | null;
  eo_expiry_date?: string | null;
  cybersecurity_policy_number?: string | null;
  cybersecurity_provider?: string | null;
  cybersecurity_expiry_date?: string | null;
  compliance_status?: string | null;
  outstanding_documents?: string | null;
  next_review_date?: string | null;
  banking_information_received?: boolean;
  banking_last_four?: string | null;
}

export interface AdvisorContract {
  id: string;
  advisor_id: string;
  carrier_mga_id?: string | null;
  company_name: string;
  advisor_code_masked?: string | null;
  sponsorship_status?: string | null;
  effective_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
  carrier?: {
    id: string;
    company_name: string;
    mga_name?: string | null;
  } | null;
  created_at: string;
  updated_at?: string;
}

export interface Advisor {
  id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  alternate_phone?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  previous_mga?: string | null;
  new_mga?: string | null;
  reason_for_leaving?: string | null;
  advisor_notes?: string | null;
  goals?: string | null;
  recruitment_stage: string;
  next_follow_up_at?: string | null;
  stage_reason?: string | null;
  archived_at?: string | null;
  compliance?: AdvisorCompliance[];
  created_at: string;
  updated_at?: string;
}

export interface Commission {
  id: string;
  advisor_id: string;
  advisor?: Pick<Advisor, 'id' | 'first_name' | 'last_name' | 'email'>;
  policy_reference: string;
  policy_number_masked?: string | null;
  insurer: string;
  product_type?: string | null;
  commission_percentage?: number | null;
  commission_amount?: number | null;
  commission_status: string;
  policy_effective_date?: string | null;
  commission_release_date?: string | null;
  payment_date?: string | null;
  annual_reminder_date?: string | null;
  created_at: string;
}

export interface QuoteNotification {
  id: string;
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED';
  attempt_count: number;
  last_error_message?: string | null;
  created_at: string;
  lead?: Lead & { public_id?: string };
}

export interface EmailMessage {
  id: string;
  context_type: string;
  context_id?: string | null;
  to_addresses: string[];
  cc_addresses: string[];
  bcc_addresses: string[];
  subject: string;
  body_html: string;
  status: string;
  previewed_at?: string | null;
  last_error_message?: string | null;
  created_at: string;
}

export function advisorName(advisor?: Pick<Advisor, 'first_name' | 'last_name'> | null): string {
  return `${advisor?.first_name || ''} ${advisor?.last_name || ''}`.trim() || 'Unnamed advisor';
}

export const insuranceInterests = [
  'TERM_LIFE',
  'WHOLE_LIFE',
  'MORTGAGE_PROTECTION',
  'CRITICAL_ILLNESS',
  'DISABILITY',
  'TRAVEL',
  'BUSINESS',
  'SEGREGATED_FUNDS',
  'OTHER',
] as const;

export const leadSources = [
  'ORGANIC_SEARCH',
  'GOOGLE_BUSINESS',
  'SOCIAL',
  'DIRECT',
  'REFERRAL',
  'MARBLISM',
  'EMAIL',
  'PAID_ADS',
  'OTHER',
] as const;

export function formatLabel(value?: string | null): string {
  if (!value) return 'Not set';
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatDate(value?: string | null, includeTime = false): string {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Invalid date';

  return new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'medium',
    ...(includeTime ? { timeStyle: 'short', timeZone: 'America/Edmonton' } : {}),
  }).format(date);
}

export function contactName(contact?: Contact | null): string {
  const name = `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim();
  return name || 'Unassigned contact';
}

interface CrmRequestOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
}

export async function crmRequest<T>(resource: string, options: CrmRequestOptions = {}): Promise<T> {
  const params = new URLSearchParams({ resource });
  Object.entries(options.params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  const response = await fetch(`/api/crm?${params.toString()}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : null;

  if (response.status === 401) {
    window.location.assign('/management/login');
    throw new Error('Your session has expired');
  }

  if (response.status === 403) {
    window.location.assign('/management/access-denied');
    throw new Error('Management access is not authorized');
  }

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'The management request failed');
  }

  return payload as T;
}
