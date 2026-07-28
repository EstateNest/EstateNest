// Webhook & Automation Events System for EstateNest
// Provides integration points for n8n, Marblism, and other automation tools

export type WebhookEventType =
  | 'lead.created'
  | 'lead.updated'
  | 'lead.status_changed'
  | 'lead.assigned'
  | 'appointment.created'
  | 'appointment.updated'
  | 'appointment.cancelled'
  | 'task.created'
  | 'task.completed'
  | 'content.created'
  | 'content.approved'
  | 'content.rejected'
  | 'contact.created';

export interface WebhookEvent {
  event: WebhookEventType;
  timestamp: string;
  data: Record<string, unknown>;
  metadata?: {
    source?: string;
    campaign?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  };
}

// Event payloads
export interface LeadCreatedPayload {
  lead_id: string;
  contact_id: string;
  contact_name: string;
  email: string;
  phone?: string;
  province?: string;
  insurance_interest: string;
  source: string;
  campaign?: string;
  landing_page?: string;
  lead_score?: number;
}

export interface LeadStatusChangedPayload {
  lead_id: string;
  contact_name: string;
  old_status: string;
  new_status: string;
  changed_by?: string;
}

export interface AppointmentCreatedPayload {
  appointment_id: string;
  lead_id: string;
  lead_name: string;
  title: string;
  date: string;
  duration_minutes: number;
  meeting_type: string;
  meeting_link?: string;
  advisor_id?: string;
}

export interface TaskCreatedPayload {
  task_id: string;
  title: string;
  description?: string;
  lead_id?: string;
  assigned_to?: string;
  due_date?: string;
  priority: string;
}

export interface ContentApprovedPayload {
  draft_id: string;
  title: string;
  content_type: string;
  approved_by: string;
  published_at?: string;
}

// In-memory webhook registry (in production, use database)
const webhookRegistry: Map<string, { url: string; events: WebhookEventType[]; secret?: string }> = new Map();

// Register a webhook endpoint
export function registerWebhook(id: string, url: string, events: WebhookEventType[], secret?: string) {
  webhookRegistry.set(id, { url, events, secret });
}

// Unregister a webhook
export function unregisterWebhook(id: string) {
  webhookRegistry.delete(id);
}

// Get registered webhooks
export function getWebhooks() {
  return Array.from(webhookRegistry.entries()).map(([id, config]) => ({
    id,
    ...config,
  }));
}

// Create HMAC signature for webhook payload
export function createWebhookSignature(payload: string, secret: string): string {
  const crypto = require('crypto');
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

// Verify webhook signature
export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = createWebhookSignature(payload, secret);
  return timingSafeEqual(signature, expectedSignature);
}

// Timing-safe string comparison
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Dispatch event to all registered webhooks
export async function dispatchWebhookEvent(
  event: WebhookEventType,
  data: Record<string, unknown>,
  metadata?: Record<string, unknown>
): Promise<void> {
  const fullEvent: WebhookEvent = {
    event,
    timestamp: new Date().toISOString(),
    data,
    metadata: metadata as WebhookEvent['metadata'],
  };

  const payload = JSON.stringify(fullEvent);

  // Log the event
  console.log(`[Webhook Event] ${event}:`, JSON.stringify(data, null, 2));

  // Send to all registered webhooks that listen for this event
  const promises = Array.from(webhookRegistry.entries())
    .filter(([_, config]) => config.events.includes(event))
    .map(async ([id, config]) => {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-EstateNest-Event': event,
          'X-EstateNest-Timestamp': fullEvent.timestamp,
        };

        // Add signature if secret is configured
        if (config.secret) {
          headers['X-EstateNest-Signature'] = createWebhookSignature(payload, config.secret);
        }

        const response = await fetch(config.url, {
          method: 'POST',
          headers,
          body: payload,
        });

        if (!response.ok) {
          console.error(`Webhook ${id} failed:`, response.statusText);
        } else {
          console.log(`Webhook ${id} delivered successfully`);
        }
      } catch (error) {
        console.error(`Webhook ${id} error:`, error);
      }
    });

  await Promise.allSettled(promises);
}

// Convenience functions for common events
export async function onLeadCreated(lead: LeadCreatedPayload) {
  await dispatchWebhookEvent('lead.created', lead, {
    source: lead.source,
    campaign: lead.campaign,
    utm_source: (lead as unknown as Record<string, string>).utm_source,
    utm_medium: (lead as unknown as Record<string, string>).utm_medium,
    utm_campaign: (lead as unknown as Record<string, string>).utm_campaign,
  });
}

export async function onLeadStatusChanged(lead: {
  id: string;
  contact?: { first_name: string; last_name: string };
  old_status: string;
  new_status: string;
  lead_owner?: string;
}) {
  await dispatchWebhookEvent('lead.status_changed', {
    lead_id: lead.id,
    contact_name: lead.contact ? `${lead.contact.first_name} ${lead.contact.last_name}` : 'Unknown',
    old_status: lead.old_status,
    new_status: lead.new_status,
    changed_by: lead.lead_owner,
  });
}

export async function onAppointmentCreated(appointment: AppointmentCreatedPayload) {
  await dispatchWebhookEvent('appointment.created', appointment);
}

export async function onTaskCreated(task: TaskCreatedPayload) {
  await dispatchWebhookEvent('task.created', task);
}

export async function onContentApproved(content: ContentApprovedPayload) {
  await dispatchWebhookEvent('content.approved', content);
}

// N8N Integration Helper
export const N8NWebhookConfig = {
  // Default N8N webhook URL pattern
  getWebhookUrl: (workflowId: string) => `https://your-n8n-instance/webhook/${workflowId}`,
  
  // Events to send to N8N for lead management
  LEAD_EVENTS: [
    'lead.created',
    'lead.status_changed',
    'lead.assigned',
  ] as WebhookEventType[],
  
  // Events to send for appointments
  APPOINTMENT_EVENTS: [
    'appointment.created',
    'appointment.updated',
    'appointment.cancelled',
  ] as WebhookEventType[],
  
  // Events to send for content
  CONTENT_EVENTS: [
    'content.created',
    'content.approved',
    'content.rejected',
  ] as WebhookEventType[],
};

// Marblism Integration Helper
export const MarblismWebhookConfig = {
  // STAN - Lead Generation
  onProspectGenerated: async (prospect: {
    name: string;
    source: string;
    score?: number;
  }) => {
    console.log('[Marblism-STAN] New prospect generated:', prospect);
    // This would integrate with Marblism's API when available
  },
  
  // PENNY - SEO/Content
  onContentDraftReady: async (draft: {
    title: string;
    content_type: string;
    draft_id: string;
  }) => {
    console.log('[Marblism-PENNY] Content draft ready:', draft);
  },
  
  // SONNY - Social Media
  onSocialDraftReady: async (draft: {
    title: string;
    platform: string;
    draft_id: string;
  }) => {
    console.log('[Marblism-SONNY] Social draft ready:', draft);
  },
  
  // EVA - Admin Workflows
  onWorkflowTriggered: async (workflow: {
    name: string;
    type: string;
    data: Record<string, unknown>;
  }) => {
    console.log('[Marblism-EVA] Workflow triggered:', workflow);
  },
};

// Export event types for use in type checking
export const WEBHOOK_EVENT_TYPES = {
  LEAD_CREATED: 'lead.created',
  LEAD_UPDATED: 'lead.updated',
  LEAD_STATUS_CHANGED: 'lead.status_changed',
  LEAD_ASSIGNED: 'lead.assigned',
  APPOINTMENT_CREATED: 'appointment.created',
  APPOINTMENT_UPDATED: 'appointment.updated',
  APPOINTMENT_CANCELLED: 'appointment.cancelled',
  TASK_CREATED: 'task.created',
  TASK_COMPLETED: 'task.completed',
  CONTENT_CREATED: 'content.created',
  CONTENT_APPROVED: 'content.approved',
  CONTENT_REJECTED: 'content.rejected',
  CONTACT_CREATED: 'contact.created',
} as const;

// Human-readable labels for events
export const WEBHOOK_EVENT_LABELS: Record<WebhookEventType, string> = {
  'lead.created': 'New Lead Created',
  'lead.updated': 'Lead Updated',
  'lead.status_changed': 'Lead Status Changed',
  'lead.assigned': 'Lead Assigned',
  'appointment.created': 'Appointment Created',
  'appointment.updated': 'Appointment Updated',
  'appointment.cancelled': 'Appointment Cancelled',
  'task.created': 'Task Created',
  'task.completed': 'Task Completed',
  'content.created': 'Content Draft Created',
  'content.approved': 'Content Approved',
  'content.rejected': 'Content Rejected',
  'contact.created': 'New Contact Created',
};
