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
  province?: string | null;
  city?: string | null;
  preferred_contact_method?: string | null;
  marketing_consent?: boolean;
  created_at: string;
  leads?: Lead[];
}

export interface Lead {
  id: string;
  contact_id?: string | null;
  contact?: Contact | null;
  source: string;
  insurance_interest: string;
  lead_status: string;
  lead_score?: number;
  notes?: string | null;
  next_follow_up_at?: string | null;
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
  'NEW',
  'ATTEMPTED_CONTACT',
  'CONTACTED',
  'APPOINTMENT_BOOKED',
  'NEEDS_ANALYSIS',
  'QUOTE_PREPARED',
  'QUOTE_PRESENTED',
  'APPLICATION_STARTED',
  'APPLICATION_SUBMITTED',
  'UNDERWRITING',
  'REQUIREMENTS_PENDING',
  'APPROVED',
  'POLICY_ISSUED',
  'POLICY_DELIVERED',
  'FOLLOW_UP',
  'NOT_TAKEN',
  'LOST',
] as const;

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

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'The management request failed');
  }

  return payload as T;
}
