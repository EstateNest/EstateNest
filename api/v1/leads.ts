// Leads API Routes
import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { z } from 'zod';
import { getSessionCookieName } from '../../src/lib/auth';
import { getSessionByToken, getLeads, getLeadById, createLead, updateLead, createContact, getLeadsNeedingFollowUp, createLeadActivity, createLeadNote, getDashboardStats } from '../../src/lib/db';
import { sendLeadNotification } from '../../src/lib/email';
import { onLeadCreated, onLeadStatusChanged } from '../../src/lib/webhooks';

const leads = new Hono();

// Session context middleware
async function requireAuth(c: any, next: any) {
  const sessionToken = getCookie(c, getSessionCookieName());
  
  if (!sessionToken) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const session = await getSessionByToken(sessionToken);
  
  if (!session || new Date(session.expires_at) < new Date()) {
    return c.json({ error: 'Session expired' }, 401);
  }
  
  c.set('user', session.user);
  await next();
}

// Validation schemas
const createLeadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  province: z.string().optional(),
  insuranceInterest: z.enum(['TERM_LIFE', 'WHOLE_LIFE', 'MORTGAGE_PROTECTION', 'CRITICAL_ILLNESS', 'DISABILITY', 'TRAVEL', 'BUSINESS', 'SEGREGATED_FUNDS', 'OTHER']),
  source: z.enum(['ORGANIC_SEARCH', 'GOOGLE_BUSINESS', 'SOCIAL', 'DIRECT', 'REFERRAL', 'MARBLISM', 'EMAIL', 'PAID_ADS', 'OTHER']).optional(),
  campaign: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  landingPage: z.string().optional(),
  notes: z.string().optional(),
  marketingConsent: z.boolean().optional(),
});

const updateLeadSchema = z.object({
  leadStatus: z.string().optional(),
  leadOwner: z.string().uuid().optional(),
  leadScore: z.number().min(0).max(100).optional(),
  nextFollowUp: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const addNoteSchema = z.object({
  note: z.string().min(1).max(5000),
});

// POST /api/leads - Create a new lead
leads.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const validated = createLeadSchema.parse(body);
    
    // Create or find contact
    let contact;
    if (validated.email) {
      contact = await createContact({
        first_name: validated.firstName,
        last_name: validated.lastName,
        email: validated.email,
        phone: validated.phone,
        province: validated.province,
        marketing_consent: validated.marketingConsent || false,
        consent_timestamp: validated.marketingConsent ? new Date().toISOString() : null,
        preferred_contact_method: 'EITHER',
      });
    }
    
    // Create lead
    const lead = await createLead({
      contact_id: contact?.id || null,
      source: validated.source || 'ORGANIC_SEARCH',
      campaign: validated.campaign,
      utm_source: validated.utmSource,
      utm_medium: validated.utmMedium,
      utm_campaign: validated.utmCampaign,
      landing_page: validated.landingPage,
      insurance_interest: validated.insuranceInterest,
      lead_status: 'NEW',
      notes: validated.notes,
      lead_score: 50, // Initial score
    });
    
    // Send lead notification email
    try {
      await sendLeadNotification({
        contactName: `${validated.firstName} ${validated.lastName}`,
        email: validated.email || '',
        phone: validated.phone,
        province: validated.province,
        insuranceInterest: validated.insuranceInterest,
        source: validated.source || 'ORGANIC_SEARCH',
        campaign: validated.campaign,
        utmSource: validated.utmSource,
        utmMedium: validated.utmMedium,
        utmCampaign: validated.utmCampaign,
        landingPage: validated.landingPage,
        notes: validated.notes,
        timestamp: new Date().toISOString(),
      });
    } catch (emailError) {
      console.error('Failed to send lead notification:', emailError);
      // Don't fail the request if email fails
    }
    
    // Trigger webhook
    await onLeadCreated({
      lead_id: lead.id,
      contact_id: contact?.id || '',
      contact_name: `${validated.firstName} ${validated.lastName}`,
      email: validated.email || '',
      phone: validated.phone,
      province: validated.province,
      insurance_interest: validated.insuranceInterest,
      source: validated.source || 'ORGANIC_SEARCH',
      campaign: validated.campaign,
      landing_page: validated.landingPage,
      lead_score: 50,
    });
    
    return c.json({
      success: true,
      lead: {
        id: lead.id,
        status: lead.lead_status,
        createdAt: lead.created_at,
      },
      message: 'Lead created successfully',
    }, 201);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation Error',
        details: error.errors,
      }, 400);
    }
    
    console.error('Error creating lead:', error);
    return c.json({
      error: 'Failed to create lead',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// GET /api/leads - List leads
leads.get('/', requireAuth, async (c) => {
  try {
    const query = c.req.query();
    
    const filters: {
      status?: any;
      source?: any;
      owner?: string;
      limit?: number;
      offset?: number;
    } = {};
    
    if (query.status) filters.status = query.status;
    if (query.source) filters.source = query.source;
    if (query.owner) filters.owner = query.owner;
    if (query.limit) filters.limit = parseInt(query.limit, 10);
    if (query.offset) filters.offset = parseInt(query.offset, 10);
    
    const { leads: leadList, total } = await getLeads(filters);
    
    return c.json({
      success: true,
      leads: leadList,
      pagination: {
        total,
        limit: filters.limit || 10,
        offset: filters.offset || 0,
      },
    });
    
  } catch (error) {
    console.error('Error fetching leads:', error);
    return c.json({
      error: 'Failed to fetch leads',
    }, 500);
  }
});

// GET /api/leads/stats - Dashboard stats
leads.get('/stats', requireAuth, async (c) => {
  try {
    const stats = await getDashboardStats();
    
    return c.json({
      success: true,
      stats,
    });
    
  } catch (error) {
    console.error('Error fetching stats:', error);
    return c.json({
      error: 'Failed to fetch stats',
    }, 500);
  }
});

// GET /api/leads/followup - Leads needing follow-up
leads.get('/followup', requireAuth, async (c) => {
  try {
    const leadsNeedingFollowUp = await getLeadsNeedingFollowUp();
    
    return c.json({
      success: true,
      leads: leadsNeedingFollowUp,
    });
    
  } catch (error) {
    console.error('Error fetching follow-up leads:', error);
    return c.json({
      error: 'Failed to fetch follow-up leads',
    }, 500);
  }
});

// GET /api/leads/:id - Get single lead
leads.get('/:id', requireAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const lead = await getLeadById(id);
    
    if (!lead) {
      return c.json({
        error: 'Lead not found',
      }, 404);
    }
    
    return c.json({
      success: true,
      lead,
    });
    
  } catch (error) {
    console.error('Error fetching lead:', error);
    return c.json({
      error: 'Failed to fetch lead',
    }, 500);
  }
});

// PATCH /api/leads/:id - Update lead
leads.patch('/:id', requireAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const validated = updateLeadSchema.parse(body);
    
    const currentLead = await getLeadById(id);
    
    if (!currentLead) {
      return c.json({
        error: 'Lead not found',
      }, 404);
    }
    
    const updates: any = {};
    const oldStatus = currentLead.lead_status;
    
    if (validated.leadStatus) {
      updates.lead_status = validated.leadStatus;
      
      // Record status change activity
      await createLeadActivity({
        lead_id: id,
        user_id: c.get('user').id,
        activity_type: 'STATUS_CHANGE',
        old_value: oldStatus,
        new_value: validated.leadStatus,
        description: `Status changed from ${oldStatus} to ${validated.leadStatus}`,
      });
    }
    
    if (validated.leadOwner !== undefined) {
      updates.lead_owner = validated.leadOwner || null;
    }
    
    if (validated.leadScore !== undefined) {
      updates.lead_score = validated.leadScore;
    }
    
    if (validated.nextFollowUp) {
      updates.next_follow_up_at = validated.nextFollowUp;
      updates.last_contacted_at = new Date().toISOString();
    }
    
    if (validated.notes !== undefined) {
      updates.notes = validated.notes;
    }
    
    const updatedLead = await updateLead(id, updates);
    
    // Trigger webhook for status change
    if (validated.leadStatus && validated.leadStatus !== oldStatus) {
      await onLeadStatusChanged({
        id: updatedLead.id,
        contact: currentLead.contact,
        old_status: oldStatus,
        new_status: validated.leadStatus,
        lead_owner: c.get('user').id,
      });
    }
    
    return c.json({
      success: true,
      lead: updatedLead,
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation Error',
        details: error.errors,
      }, 400);
    }
    
    console.error('Error updating lead:', error);
    return c.json({
      error: 'Failed to update lead',
    }, 500);
  }
});

// POST /api/leads/:id/notes - Add note to lead
leads.post('/:id/notes', requireAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const validated = addNoteSchema.parse(body);
    
    const lead = await getLeadById(id);
    
    if (!lead) {
      return c.json({
        error: 'Lead not found',
      }, 404);
    }
    
    const note = await createLeadNote({
      lead_id: id,
      user_id: c.get('user').id,
      note: validated.note,
    });
    
    // Create activity
    await createLeadActivity({
      lead_id: id,
      user_id: c.get('user').id,
      activity_type: 'NOTE_ADDED',
      description: 'Note added to lead',
    });
    
    return c.json({
      success: true,
      note,
    }, 201);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation Error',
        details: error.errors,
      }, 400);
    }
    
    console.error('Error adding note:', error);
    return c.json({
      error: 'Failed to add note',
    }, 500);
  }
});

// POST /api/leads/:id/activities - Record activity
leads.post('/:id/activities', requireAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const lead = await getLeadById(id);
    
    if (!lead) {
      return c.json({
        error: 'Lead not found',
      }, 404);
    }
    
    const activity = await createLeadActivity({
      lead_id: id,
      user_id: c.get('user').id,
      activity_type: body.activityType || 'MANUAL_ACTIVITY',
      description: body.description,
    });
    
    return c.json({
      success: true,
      activity,
    }, 201);
    
  } catch (error) {
    console.error('Error recording activity:', error);
    return c.json({
      error: 'Failed to record activity',
    }, 500);
  }
});

export default leads;
