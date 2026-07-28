// Contacts API Routes
import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { z } from 'zod';
import { getSessionCookieName } from '../../src/lib/auth';
import { getSessionByToken, createContact, getContactById, supabaseAdmin } from '../../src/lib/db';

const contacts = new Hono();

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
const createContactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  preferredContactMethod: z.enum(['PHONE', 'EMAIL', 'TEXT', 'EITHER']).optional(),
  marketingConsent: z.boolean().optional(),
});

// GET /api/contacts - List contacts
contacts.get('/', requireAuth, async (c) => {
  try {
    const query = c.req.query();
    const limit = parseInt(query.limit || '50', 10);
    const offset = parseInt(query.offset || '0', 10);
    
    let queryBuilder = supabaseAdmin
      .from('contacts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (query.province) {
      queryBuilder = queryBuilder.eq('province', query.province);
    }
    
    if (query.search) {
      queryBuilder = queryBuilder.or(`first_name.ilike.%${query.search}%,last_name.ilike.%${query.search}%,email.ilike.%${query.search}%`);
    }
    
    const { data, error, count } = await queryBuilder;
    
    if (error) throw error;
    
    return c.json({
      success: true,
      contacts: data,
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
    });
    
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return c.json({
      error: 'Failed to fetch contacts',
    }, 500);
  }
});

// POST /api/contacts - Create contact
contacts.post('/', requireAuth, async (c) => {
  try {
    const body = await c.req.json();
    const validated = createContactSchema.parse(body);
    
    const contact = await createContact({
      first_name: validated.firstName,
      last_name: validated.lastName,
      email: validated.email,
      phone: validated.phone,
      province: validated.province,
      city: validated.city,
      preferred_contact_method: validated.preferredContactMethod || 'EITHER',
      marketing_consent: validated.marketingConsent || false,
      consent_timestamp: validated.marketingConsent ? new Date().toISOString() : null,
    });
    
    return c.json({
      success: true,
      contact,
    }, 201);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation Error',
        details: error.errors,
      }, 400);
    }
    
    console.error('Error creating contact:', error);
    return c.json({
      error: 'Failed to create contact',
    }, 500);
  }
});

// GET /api/contacts/:id - Get single contact
contacts.get('/:id', requireAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const contact = await getContactById(id);
    
    if (!contact) {
      return c.json({
        error: 'Contact not found',
      }, 404);
    }
    
    // Get associated leads
    const { data: leads } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('contact_id', id)
      .order('created_at', { ascending: false });
    
    return c.json({
      success: true,
      contact,
      leads: leads || [],
    });
    
  } catch (error) {
    console.error('Error fetching contact:', error);
    return c.json({
      error: 'Failed to fetch contact',
    }, 500);
  }
});

// PATCH /api/contacts/:id - Update contact
contacts.patch('/:id', requireAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const { data, error } = await supabaseAdmin
      .from('contacts')
      .update({
        first_name: body.firstName,
        last_name: body.lastName,
        email: body.email,
        phone: body.phone,
        province: body.province,
        city: body.city,
        preferred_contact_method: body.preferredContactMethod,
        marketing_consent: body.marketingConsent,
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return c.json({
      success: true,
      contact: data,
    });
    
  } catch (error) {
    console.error('Error updating contact:', error);
    return c.json({
      error: 'Failed to update contact',
    }, 500);
  }
});

export default contacts;
