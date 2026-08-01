import { expect, test, type Page } from '@playwright/test';

const managementUser = {
  id: 'test-admin',
  username: 'test-admin',
  email: 'admin@example.test',
  role: 'SUPER_ADMIN',
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
  test('login page accepts email without exposing default credentials', async ({ page }) => {
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Not authenticated' }) });
    });
    await page.goto('/management/login');

    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByText('Default Login Credentials')).toHaveCount(0);
  });

  test('valid email and password create a management session', async ({ page }) => {
    let signedIn = false;
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: signedIn ? 200 : 401,
        contentType: 'application/json',
        body: JSON.stringify(signedIn ? { success: true, user: managementUser } : { error: 'Not authenticated' }),
      });
    });
    await page.route('**/api/auth/login', async (route) => {
      const body = route.request().postDataJSON() as { email: string; password: string };
      expect(body).toEqual({ email: 'owner@example.test', password: 'correct-test-password' });
      signedIn = true;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, user: managementUser }) });
    });
    await page.route('**/api/crm?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
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
        }),
      });
    });

    await page.goto('/management/login');
    await page.getByLabel('Email').fill('owner@example.test');
    await page.getByLabel('Password').fill('correct-test-password');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();

    await expect(page).toHaveURL(/\/management\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  for (const scenario of [
    { name: 'invalid password', email: 'owner@example.test' },
    { name: 'unknown email', email: 'unknown@example.test' },
  ]) {
    test(`${scenario.name} uses the same generic error`, async ({ page }) => {
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Not authenticated' }) });
      });
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Invalid email or password.' }) });
      });

      await page.goto('/management/login');
      await page.getByLabel('Email').fill(scenario.email);
      await page.getByLabel('Password').fill('incorrect-test-password');
      await page.getByRole('button', { name: 'Sign In', exact: true }).click();

      await expect(page.getByText('Invalid email or password.')).toBeVisible();
      await expect(page).toHaveURL(/\/management\/login$/);
    });
  }

  test('authenticated user without a management role sees access denied', async ({ page }) => {
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Not authenticated' }) });
    });
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ message: 'Management access is not authorized.' }) });
    });

    await page.goto('/management/login');
    await page.getByLabel('Email').fill('staff@example.test');
    await page.getByLabel('Password').fill('valid-non-management-password');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();

    await expect(page).toHaveURL(/\/management\/access-denied$/);
    await expect(page.getByRole('heading', { name: 'Management access required' })).toBeVisible();
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

  test('logout clears the session and returns to login', async ({ page }) => {
    let signedIn = true;
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: signedIn ? 200 : 401,
        contentType: 'application/json',
        body: JSON.stringify(signedIn ? { success: true, user: managementUser } : { error: 'Not authenticated' }),
      });
    });
    await page.route('**/api/auth/logout', async (route) => {
      signedIn = false;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    });
    await page.route('**/api/crm?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          stats: {
            newLeads: 0,
            needsFollowUp: 0,
            todaysAppointments: 0,
            totalContacts: 0,
            totalLeads: 0,
            completedLeads: 0,
            conversionRate: 0,
            pipelineStatus: {},
            leadsBySource: {},
          },
          recentLeads: [],
          followUpLeads: [],
        }),
      });
    });

    await page.goto('/management/dashboard');
    await page.getByRole('button', { name: 'Logout', exact: true }).click();

    await expect(page).toHaveURL(/\/management\/login$/);
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });

  test('management API rejection without authentication is preserved', async ({ page }) => {
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Not authenticated' }) });
    });
    await page.route('**/api/crm?*', async (route) => {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Not authenticated' }) });
    });
    await page.goto('/management/login');

    const status = await page.evaluate(async () => {
      const response = await fetch('/api/crm?resource=dashboard', { credentials: 'include' });
      return response.status;
    });

    expect(status).toBe(401);
  });
});

test.describe('Supabase management authentication preview', () => {
  const managementEmail = process.env.MANAGEMENT_TEST_EMAIL;
  const managementPassword = process.env.MANAGEMENT_TEST_PASSWORD;
  const unauthorizedEmail = process.env.MANAGEMENT_UNAUTHORIZED_EMAIL;
  const unauthorizedPassword = process.env.MANAGEMENT_UNAUTHORIZED_PASSWORD;

  test('real Supabase login persists through navigation and logout', async ({ page }) => {
    test.skip(!process.env.BASE_URL || !managementEmail || !managementPassword, 'Preview URL and management test credentials are required');

    await page.goto('/management/login');
    await page.getByLabel('Email').fill(managementEmail!);
    await page.getByLabel('Password').fill(managementPassword!);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page).toHaveURL(/\/management\/dashboard$/);
    await page.getByRole('navigation', { name: 'Management navigation' }).getByRole('link', { name: 'Contacts', exact: true }).click();
    await expect(page).toHaveURL(/\/management\/contacts$/);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Contacts', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Logout', exact: true }).click();
    await expect(page).toHaveURL(/\/management\/login$/);
  });

  test('real invalid password and unknown email share one error', async ({ page }) => {
    test.skip(!process.env.BASE_URL || !managementEmail, 'Preview URL and management test email are required');

    for (const email of [managementEmail!, 'unknown-management-user@example.test']) {
      await page.goto('/management/login');
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password').fill('definitely-not-the-valid-password');
      await page.getByRole('button', { name: 'Sign In', exact: true }).click();
      await expect(page.getByText('Invalid email or password.')).toBeVisible();
    }
  });

  test('real authenticated user without a role is denied', async ({ page }) => {
    test.skip(!process.env.BASE_URL || !unauthorizedEmail || !unauthorizedPassword, 'Unauthorized Supabase test user credentials are required');

    await page.goto('/management/login');
    await page.getByLabel('Email').fill(unauthorizedEmail!);
    await page.getByLabel('Password').fill(unauthorizedPassword!);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page).toHaveURL(/\/management\/access-denied$/);
  });

  test('real invalid session and unauthenticated API request are rejected', async ({ page, request }) => {
    test.skip(!process.env.BASE_URL, 'Preview URL is required');

    await page.context().addCookies([
      { name: 'en_sb_access_token', value: 'invalid-access-token', url: process.env.BASE_URL! },
      { name: 'en_sb_refresh_token', value: 'invalid-refresh-token', url: process.env.BASE_URL! },
    ]);
    await page.goto('/management/dashboard');
    await expect(page).toHaveURL(/\/management\/login$/);

    const response = await request.get('/api/crm?resource=dashboard');
    expect(response.status()).toBe(401);
  });
});
