// Webhooks API Routes
// Handles inbound leads from external sources and Marblism integrations
import { Hono } from 'hono';
import { z } from 'zod';
import { verifyWebhookSignature } from '../../src/lib/webhooks';
import { createContact, createLead, createFunnelSubmission, supabaseAdmin } from '../../src/lib/db';
import { sendLeadNotification } from '../../src/lib/email';
import { onLeadCreated } from '../../src/lib/webhooks';

const webhooks = new Hono();

// Webhook secret for validation (optional - set in environment)
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

// Idempotency tracking (in production, use Redis or database)
const processedIds = new Set<string>();
const IDEMPOTENCY_WINDOW = 24 * 60 * 60 * 1000; // 24 hours

// Clean up old idempotency keys periodically
setInterval(() => {
  // In production, implement proper cleanup
}, 60 * 60 * 1000); // Every hour

// Validate webhook signature (for authenticated webhooks)
async function validateWebhookAuth(c: any, next: any) {
  if (!WEBHOOK_SECRET) {
    // Skip validation if no secret configured
    await next();
    return;
  }
  
  const signature = c.req.header('x-webhook-signature');
  const timestamp = c.req.header('x-webhook-timestamp');
  
  if (!signature) {
    return c.json({ error: 'Missing signature' }, 401);
  }
  
  // Check timestamp (prevent replay attacks)
  if (timestamp) {
    const age = Date.now() - parseInt(timestamp, 10);
    if (age > 5 * 60 * 1000) { // 5 minutes
      return c.json({ error: 'Webhook timestamp too old' }, 401);
    }
  }
  
  const body = await c.req.text();
  const isValid = verifyWebhookSignature(body, signature, WEBHOOK_SECRET);
  
  if (!isValid) {
    return c.json({ error: 'Invalid signature' }, 401);
  }
  
  // Re-parse JSON after validation
  c.req.json = () => JSON.parse(body);
  await next();
}

// Rate limiting for webhooks (simple in-memory, use Redis in production)
const webhookRates = new Map<string, { count: number; resetAt: number }>();
const WEBHOOK_RATE_LIMIT = 100; // requests per minute
const WEBHOOK_RATE_WINDOW = 60 * 1000;

function checkWebhookRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = webhookRates.get(ip);
  
  if (!record || now > record.resetAt) {
    webhookRates.set(ip, { count: 1, resetAt: now + WEBHOOK_RATE_WINDOW });
    return true;
  }
  
  if (record.count >= WEBHOOK_RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

// Inbound Lead Schema (from public forms)
const inboundLeadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  insuranceInterest: z.string().optional(),
  interest: z.string().optional(), // Alias for insuranceInterest
  source: z.string().optional(),
  campaign: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  landingPage: z.string().optional(),
  landing_page: z.string().optional(), // Alias
  referringUrl: z.string().optional(),
  referring_url: z.string().optional(), // Alias
  notes: z.string().optional(),
  message: z.string().optional(), // Alias for notes
  marketingConsent: z.boolean().optional(),
  consent: z.boolean().optional(), // Alias
  // Idempotency
  idempotencyId: z.string().optional(),
  idempotency_id: z.string().optional(), // Alias
});

// Marblism STAN Lead Schema
const marblismLeadSchema = z.object({
  event: z.enum(['lead.created', 'prospect.generated']),
  prospect: z.object({
    id: z.string(),
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    source: z.string().optional(),
    score: z.number().optional(),
    metadata: z.record(z.any()).optional(),
  }),
  timestamp: z.string().datetime(),
});

// POST /api/webhooks/inbound-lead - Public endpoint for lead capture forms
webhooks.post('/inbound-lead', async (c) => {
  try {
    // Rate limiting
    const ip = c.req.header('x-forwarded-for') || 'unknown';
    if (!checkWebhookRateLimit(ip)) {
      return c.json({ error: 'Rate limit exceeded' }, 429);
    }
    
    const body = await c.req.json();
    const validated = inboundLeadSchema.parse(body);
    
    // Idempotency check
    const idempotencyId = validated.idempotencyId || validated.idempotency_id;
    if (idempotencyId) {
      if (processedIds.has(idempotencyId)) {
        return c.json({
          success: true,
          message: 'Lead already processed (idempotent)',
          duplicate: true,
        });
      }
      processedIds.add(idempotencyId);
    }
    
    // Normalize field names
    const insuranceInterest = validated.insuranceInterest || validated.interest || 'OTHER';
    const landingPage = validated.landingPage || validated.landing_page;
    const referringUrl = validated.referringUrl || validated.referring_url;
    const notes = validated.notes || validated.message;
    const marketingConsent = validated.marketingConsent || validated.consent;
    const utmSource = validated.utmSource;
    const utmMedium = validated.utmMedium;
    const utmCampaign = validated.utmCampaign;
    
    // Determine source
    let source = 'ORGANIC_SEARCH';
    if (validated.source) {
      const sourceMap: Record<string, string> = {
        'google': 'ORGANIC_SEARCH',
        'google_business': 'GOOGLE_BUSINESS',
        'social': 'SOCIAL',
        'facebook': 'SOCIAL',
        'instagram': 'SOCIAL',
        'linkedin': 'SOCIAL',
        'referral': 'REFERRAL',
        'email': 'EMAIL',
        'paid': 'PAID_ADS',
        'marblism': 'MARBLISM',
      };
      source = sourceMap[validated.source.toLowerCase()] || 'OTHER';
    }
    
    // Get additional context
    const userAgent = c.req.header('user-agent');
    
    // Create contact
    let contact = null;
    if (validated.email) {
      contact = await createContact({
        first_name: validated.firstName,
        last_name: validated.lastName,
        email: validated.email,
        phone: validated.phone,
        province: validated.province,
        city: validated.city,
        marketing_consent: marketingConsent || false,
        consent_timestamp: marketingConsent ? new Date().toISOString() : null,
        preferred_contact_method: 'EITHER',
      });
    }
    
    // Create lead
    const lead = await createLead({
      contact_id: contact?.id || null,
      source: source as any,
      campaign: validated.campaign,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      landing_page: landingPage,
      insurance_interest: (insuranceInterest.toUpperCase().replace(/ /g, '_')) as any || 'OTHER',
      lead_status: 'NEW',
      notes: notes,
      lead_score: 50,
    });
    
    // Create funnel submission record
    await createFunnelSubmission({
      lead_id: lead.id,
      contact_id: contact?.id,
      funnel_type: 'GENERAL_INQUIRY',
      source: source as any,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      landing_page: landingPage,
      referring_url: referringUrl,
      submission_data: validated as any,
      ip_address: ip,
      user_agent: userAgent || undefined,
    });
    
    // Send lead notification
    try {
      await sendLeadNotification({
        contactName: `${validated.firstName} ${validated.lastName}`,
        email: validated.email || '',
        phone: validated.phone,
        province: validated.province,
        insuranceInterest: insuranceInterest,
        source: source,
        campaign: validated.campaign,
        utmSource: utmSource,
        utmMedium: utmMedium,
        utmCampaign: utmCampaign,
        landingPage: landingPage,
        notes: notes,
        timestamp: new Date().toISOString(),
      });
    } catch (emailError) {
      console.error('Failed to send lead notification:', emailError);
      // Don't fail the request
    }
    
    // Trigger webhook event
    await onLeadCreated({
      lead_id: lead.id,
      contact_id: contact?.id || '',
      contact_name: `${validated.firstName} ${validated.lastName}`,
      email: validated.email || '',
      phone: validated.phone,
      province: validated.province,
      insurance_interest: insuranceInterest,
      source: source,
      campaign: validated.campaign,
      landing_page: landingPage,
    });
    
    console.log(`[Webhook] Lead created: ${lead.id} from ${source}`);
    
    return c.json({
      success: true,
      leadId: lead.id,
      message: 'Lead captured successfully',
    }, 201);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation Error',
        details: error.errors,
      }, 400);
    }
    
    console.error('Error processing inbound lead:', error);
    return c.json({
      error: 'Failed to process lead',
    }, 500);
  }
});

// POST /api/webhooks/marblism - Marblism integration endpoint
webhooks.post('/marblism', validateWebhookAuth, async (c) => {
  try {
    const body = await c.req.json();
    const validated = marblismLeadSchema.parse(body);
    
    if (validated.event === 'lead.created' || validated.event === 'prospect.generated') {
      const prospect = validated.prospect;
      
      // Parse name
      let firstName = 'Unknown';
      let lastName = '';
      if (prospect.name) {
        const parts = prospect.name.split(' ');
        firstName = parts[0];
        lastName = parts.slice(1).join(' ') || '';
      }
      
      // Create contact if email available
      let contact = null;
      if (prospect.email) {
        contact = await createContact({
          first_name: firstName,
          last_name: lastName,
          email: prospect.email,
          phone: prospect.phone,
        });
      }
      
      // Create lead
      const lead = await createLead({
        contact_id: contact?.id || null,
        source: 'MARBLISM',
        insurance_interest: 'OTHER',
        lead_status: 'NEW',
        lead_score: prospect.score || 50,
        notes: JSON.stringify(prospect.metadata),
      });
      
      // Trigger webhook
      await onLeadCreated({
        lead_id: lead.id,
        contact_id: contact?.id || '',
        contact_name: prospect.name || `${firstName} ${lastName}`,
        email: prospect.email || '',
        phone: prospect.phone,
        province: undefined,
        insurance_interest: 'OTHER',
        source: 'MARBLISM',
      });
      
      console.log(`[Marblism Webhook] Lead created: ${lead.id}`);
    }
    
    return c.json({
      success: true,
      message: 'Webhook processed',
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation Error',
        details: error.errors,
      }, 400);
    }
    
    console.error('Error processing Marblism webhook:', error);
    return c.json({
      error: 'Failed to process webhook',
    }, 500);
  }
});

// GET /api/webhooks/health - Webhook service health check
webhooks.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      webhooks: 'active',
      idempotency: 'active',
      rateLimit: 'active',
    },
  });
});

export default webhooks;
