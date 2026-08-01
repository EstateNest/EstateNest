import { expect, test, type Page } from '@playwright/test';

const managementUser = {
  id: 'test-admin',
  username: 'test-admin',
  email: 'admin@example.test',
  role: 'ADMIN',
  firstName: 'Test',
  lastName: 'Administrator',
};

const contact = {
  id: 'contact-1',
  first_name: 'Avery',
  last_name: 'Chen',
  email: 'avery@example.test',
  phone: '780-555-0100',
  province: 'AB',
  city: 'Edmonton',
  created_at: '2026-08-01T12:00:00.000Z',
};

const lead = {
  id: 'lead-1',
  contact_id: contact.id,
  contact,
  source: 'ORGANIC_SEARCH',
  insurance_interest: 'TERM_LIFE',
  lead_status: 'NEW',
  lead_score: 70,
  notes: 'Mock lead for route verification',
  next_follow_up_at: '2026-08-02T18:00:00.000Z',
  created_at: '2026-08-01T12:00:00.000Z',
};

async function mockAuthenticatedManagement(page: Page) {
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, user: managementUser }) });
  });
  await page.route('**/api/auth/logout', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
  });
  await page.route('**/api/crm?*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const resource = url.searchParams.get('resource');
    let payload: Record<string, unknown> = { success: true };

    if (resource === 'dashboard') {
      payload = {
        success: true,
        stats: {
          newLeads: 1,
          needsFollowUp: 1,
          todaysAppointments: 0,
          totalContacts: 1,
          totalLeads: 1,
          completedLeads: 0,
          conversionRate: 0,
          pipelineStatus: { NEW: 1 },
          leadsBySource: { ORGANIC_SEARCH: 1 },
        },
        recentLeads: [lead],
        followUpLeads: [lead],
      };
    } else if (resource === 'leads') {
      payload = url.searchParams.get('id') ? { success: true, lead } : { success: true, leads: [lead], total: 1 };
    } else if (resource === 'contacts') {
      payload = url.searchParams.get('id')
        ? { success: true, contact: { ...contact, leads: [lead] } }
        : { success: true, contacts: [contact], total: 1 };
    } else if (['tasks', 'appointments', 'content'].includes(resource || '')) {
      payload = { success: true, items: [] };
    } else if (resource === 'integrations') {
      payload = {
        success: true,
        integrations: {
          supabase: true,
          email: true,
          googleAnalytics: true,
          googleTagManager: true,
          microsoftClarity: true,
        },
        user: { role: 'ADMIN', environmentManagedPassword: false },
      };
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) });
  });
}

test.describe('Estate Nest management routing', () => {
  test('login page loads without exposing default credentials', async ({ page }) => {
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Not authenticated' }) });
    });
    await page.goto('/management/login');

    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByText('Default Login Credentials')).toHaveCount(0);
  });

  test('unauthenticated dashboard access redirects to management login', async ({ page }) => {
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Not authenticated' }) });
    });
    await page.goto('/management/dashboard');
    await expect(page).toHaveURL(/\/management\/login$/);
  });

  test('every tab opens inside the authenticated management shell', async ({ page }) => {
    await mockAuthenticatedManagement(page);
    await page.goto('/management/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    const tabs = [
      ['Leads', '/management/leads'],
      ['Contacts', '/management/contacts'],
      ['Pipeline', '/management/pipeline'],
      ['Appointments', '/management/appointments'],
      ['Tasks', '/management/tasks'],
      ['Content', '/management/content'],
      ['Reports', '/management/reports'],
      ['Settings', '/management/settings'],
    ] as const;
    const managementNav = page.getByRole('navigation', { name: 'Management navigation' });

    for (const [label, path] of tabs) {
      await managementNav.getByRole('link', { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.getByRole('heading', { name: label, exact: true })).toBeVisible();
      await expect(page.getByText('404')).toHaveCount(0);
    }
  });

  test('browser back returns to the previous management tab, not the public homepage', async ({ page }) => {
    await mockAuthenticatedManagement(page);
    await page.goto('/management/dashboard');
    await page.getByRole('navigation', { name: 'Management navigation' }).getByRole('link', { name: 'Leads', exact: true }).click();
    await page.getByRole('navigation', { name: 'Management navigation' }).getByRole('link', { name: 'Contacts', exact: true }).click();

    await page.goBack();
    await expect(page).toHaveURL(/\/management\/leads$/);
    await expect(page.getByRole('heading', { name: 'Leads', exact: true })).toBeVisible();
  });

  test('unknown management URL uses an internal fallback', async ({ page }) => {
    await mockAuthenticatedManagement(page);
    await page.goto('/management/does-not-exist');

    await expect(page.getByRole('heading', { name: 'Management page not found' })).toBeVisible();
    await page.getByRole('link', { name: 'Return to dashboard' }).click();
    await expect(page).toHaveURL(/\/management\/dashboard$/);
  });

  test('quick actions open routed management forms', async ({ page }) => {
    await mockAuthenticatedManagement(page);
    await page.goto('/management/dashboard');

    await page.getByRole('link', { name: 'Add lead', exact: true }).click();
    await expect(page).toHaveURL(/\/management\/leads\/new$/);
    await expect(page.getByRole('dialog').getByRole('heading', { name: 'Add a lead' })).toBeVisible();
  });
});
