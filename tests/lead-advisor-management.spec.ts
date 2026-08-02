import { expect, test, type Page, type Route } from '@playwright/test';

const adminUser = { id: 'auth-admin-1', username: 'owner', email: 'owner@example.test', role: 'SUPER_ADMIN', firstName: 'Estate', lastName: 'Owner' };
const client = { id: 'contact-1', first_name: 'Avery', last_name: 'Chen', email: 'avery@example.test', phone: '780-555-0100', city: 'Edmonton', province: 'AB', created_at: '2026-08-01T12:00:00.000Z' };
const advisor = { id: 'advisor-1', first_name: 'Jordan', last_name: 'Singh', email: 'jordan@example.test', phone: '780-555-0110', province: 'AB', recruitment_stage: 'ONBOARDING', created_at: '2026-08-01T12:00:00.000Z', compliance: [{ id: 'compliance-1', advisor_id: 'advisor-1', life_licence_number: '••••1234', accident_sickness_licence_number: '••••4321', eo_policy_number: '••••5678', cybersecurity_policy_number: '••••9876', compliance_status: 'REVIEW_REQUIRED', next_review_date: '2026-09-01' }] };

interface MockState {
  lead: Record<string, unknown>;
  archived: boolean;
  leadPatch?: Record<string, unknown>;
  archiveReason?: string;
  emailActions: string[];
  notificationRetried: boolean;
  reportActions: string[];
  reportBodies: Array<Record<string, unknown>>;
  advisorPatch?: Record<string, unknown>;
  contractBody?: Record<string, unknown>;
  contracts: Array<Record<string, unknown>>;
  reminderBody?: Record<string, unknown>;
  reminderRules: Array<Record<string, unknown>>;
}

async function fulfillJson(route: Route, payload: unknown, status = 200) {
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(payload) });
}

async function installPortalMocks(page: Page): Promise<MockState> {
  const state: MockState = {
    lead: { id: 'lead-1', public_id: 'ENL-20260801-ABCD1234', contact_id: client.id, contact: client, source: 'ORGANIC_SEARCH', insurance_interest: 'TERM_LIFE', lead_status: 'PROSPECT', lead_score: 70, created_at: '2026-08-01T12:00:00.000Z' },
    archived: false,
    emailActions: [],
    notificationRetried: false,
    reportActions: [],
    reportBodies: [],
    contracts: [],
    reminderRules: [],
  };

  await page.route('**/api/auth/me', (route) => fulfillJson(route, { success: true, user: adminUser }));
  await page.route('**/api/auth/logout', (route) => fulfillJson(route, { success: true }));
  await page.route('**/api/auth/mfa', (route) => fulfillJson(route, { success: true, currentLevel: 'aal2', nextLevel: 'aal2', totpEnrolled: true, factors: [], passkeyAvailable: false, passkeyStatus: 'Experimental passkeys are not enabled.' }));
  await page.route('**/api/crm?*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const resource = url.searchParams.get('resource');
    const method = request.method();
    const body = request.postData() ? request.postDataJSON() as Record<string, unknown> : null;

    if (resource === 'leads') {
      if (method === 'GET') {
        if (url.searchParams.get('id')) return fulfillJson(route, { success: true, lead: { ...state.lead, archived_at: state.archived ? '2026-08-02T12:00:00.000Z' : null } });
        const wantsArchived = url.searchParams.get('archived') === 'true';
        return fulfillJson(route, { success: true, leads: wantsArchived === state.archived ? [{ ...state.lead, lead_status: state.archived ? 'ARCHIVED' : String(state.lead.lead_status), archived_at: state.archived ? '2026-08-02T12:00:00.000Z' : null }] : [], total: 1 });
      }
      if (method === 'PATCH') {
        state.leadPatch = body || {};
        if (body?.action === 'RESTORE') { state.archived = false; state.lead.lead_status = 'PROSPECT'; }
        else if (body?.leadStatus) state.lead.lead_status = body.leadStatus;
        return fulfillJson(route, { success: true, lead: { ...state.lead, outcome_reason: body?.reason, future_contact_consent: body?.futureContactConsent, stage_notes: body?.stageNotes } });
      }
      if (method === 'DELETE') {
        state.archived = true;
        state.archiveReason = String(body?.reason || '');
        state.lead.lead_status = 'ARCHIVED';
        return fulfillJson(route, { success: true });
      }
    }
    if (resource === 'contacts') {
      if (url.searchParams.get('id')) return fulfillJson(route, { success: true, contact: { ...client, leads: [state.lead] } });
      return fulfillJson(route, { success: true, contacts: url.searchParams.get('archived') === 'true' ? [] : [client], total: 1 });
    }
    if (resource === 'advisors') {
      if (method === 'PATCH') { state.advisorPatch = body || {}; return fulfillJson(route, { success: true, advisor: { ...advisor, recruitment_stage: body?.recruitmentStage || advisor.recruitment_stage } }); }
      if (url.searchParams.get('id')) return fulfillJson(route, { success: true, advisor });
      return fulfillJson(route, { success: true, advisors: url.searchParams.get('archived') === 'true' ? [] : [advisor], total: 1 });
    }
    if (resource === 'advisor-contracts') {
      if (method === 'POST') {
        state.contractBody = body || {};
        const advisorCode = String(body?.advisorCode || '');
        const contract = {
          id: 'contract-1', advisor_id: 'advisor-1', company_name: String(body?.companyName || ''),
          advisor_code_masked: advisorCode ? `••••${advisorCode.slice(-4)}` : null,
          sponsorship_status: body?.sponsorshipStatus || 'PENDING', effective_date: body?.effectiveDate || null,
          end_date: body?.endDate || null, notes: body?.notes || null, created_at: '2026-08-01T12:00:00.000Z',
        };
        state.contracts = [contract];
        return fulfillJson(route, { success: true, contract }, 201);
      }
      return fulfillJson(route, { success: true, contracts: state.contracts });
    }
    if (resource === 'compliance') return fulfillJson(route, { success: true, compliance: advisor.compliance.map((record) => ({ ...record, advisor })) });
    if (resource === 'commissions') return fulfillJson(route, { success: true, commissions: [] });
    if (resource === 'carriers') return fulfillJson(route, { success: true, carriers: [] });
    if (resource === 'reminder-rules') {
      if (method === 'POST') {
        state.reminderBody = body || {};
        const rule = {
          id: 'reminder-1', province: body?.province, licence_type: body?.licenceType,
          deadline_rule: body?.deadlineRule, reminder_days: body?.reminderDays,
          automatic_scheduling_enabled: false,
        };
        state.reminderRules = [rule];
        return fulfillJson(route, { success: true, rule }, 201);
      }
      return fulfillJson(route, { success: true, rules: state.reminderRules });
    }
    if (resource === 'notifications') {
      if (method === 'POST') { state.notificationRetried = true; return fulfillJson(route, { success: true, status: 'SENT' }); }
      return fulfillJson(route, { success: true, notifications: [{ id: 'notification-1', status: state.notificationRetried ? 'SENT' : 'FAILED', attempt_count: state.notificationRetried ? 2 : 1, last_error_message: state.notificationRetried ? null : 'Gmail SMTP temporarily unavailable.', created_at: '2026-08-01T12:01:00.000Z', lead: state.lead }] });
    }
    if (resource === 'emails') {
      if (method === 'GET') return fulfillJson(route, { success: true, messages: [], defaultBcc: ['kanwar@estatenest.ca'] });
      const action = String(body?.action || '');
      state.emailActions.push(action);
      if (action === 'SAVE_DRAFT') return fulfillJson(route, { success: true, message: { id: 'email-1', status: 'DRAFT', subject: body?.subject } }, url.searchParams.get('id') ? 200 : 201);
      if (action === 'PREVIEW') return fulfillJson(route, { success: true, message: { id: 'email-1', status: 'PREVIEWED' } });
      if (action === 'SEND') return fulfillJson(route, { success: true, status: 'SENT' });
      return fulfillJson(route, { success: true });
    }
    if (resource === 'documents') {
      if (body?.mimeType === 'application/x-msdownload') return fulfillJson(route, { message: 'Attachment type is not approved or exceeds the 10 MiB limit.' }, 400);
      return fulfillJson(route, { success: true, document: { id: 'document-1', scan_status: 'PENDING' }, uploadUrl: 'https://upload.example.test/signed' }, 201);
    }
    if (resource === 'reports') {
      const action = String(body?.action || 'GET');
      state.reportActions.push(action);
      if (body) state.reportBodies.push(body);
      if (action === 'PREVIEW') return fulfillJson(route, { success: true, previewRunId: 'report-preview-1', rowCount: 1, rows: [{ lead_id: 'ENL-20260801-ABCD1234', name: 'Avery Chen', stage: 'PROSPECT', source: 'ORGANIC_SEARCH' }] });
      if (action === 'SEND') return fulfillJson(route, { success: true, status: 'SENT' });
      return fulfillJson(route, { success: true, definitions: [], runs: [] });
    }
    if (resource === 'management-settings') return fulfillJson(route, { success: true, email: { defaultBcc: ['kanwar@estatenest.ca'] } });
    if (resource === 'dashboard') return fulfillJson(route, { success: true, stats: { newLeads: 1, needsFollowUp: 0, todaysAppointments: 0, totalContacts: 1, totalLeads: 1, completedLeads: 0, conversionRate: 0, pipelineStatus: { PROSPECT: 1 }, leadsBySource: { ORGANIC_SEARCH: 1 } }, recentLeads: [state.lead], followUpLeads: [] });
    if (['tasks', 'appointments', 'content'].includes(resource || '')) return fulfillJson(route, { success: true, items: [] });
    if (resource === 'integrations') return fulfillJson(route, { success: true, integrations: { supabase: true, email: true }, user: { role: 'SUPER_ADMIN', environmentManagedPassword: false } });
    return fulfillJson(route, { success: true });
  });
  return state;
}

test.describe('Public quote acceptance', () => {
  test('visitor success appears only after server acceptance', async ({ page }) => {
    let acceptedPayload: Record<string, unknown> | null = null;
    let releaseAcceptance: (() => void) | undefined;
    const serverAcceptance = new Promise<void>((resolve) => { releaseAcceptance = resolve; });
    await page.route('**/api/submit-quote', async (route) => {
      acceptedPayload = route.request().postDataJSON() as Record<string, unknown>;
      await serverAcceptance;
      await fulfillJson(route, { success: true, accepted: true, leadReference: 'ENL-20260801-ABCD1234', message: 'Your quote request has been securely accepted. We will contact you within 24 hours.' });
    });
    await page.goto('/quote');
    await page.getByLabel('First Name *').fill('Avery');
    await page.getByLabel('Last Name *').fill('Chen');
    await page.getByLabel('Email Address *').fill('avery@example.test');
    await page.getByLabel('Phone Number *').fill('780-555-0100');
    await page.getByLabel('Province *').click();
    await page.getByRole('option', { name: 'Alberta' }).click();
    await page.getByLabel('Smoking History *').click();
    await page.getByRole('option', { name: 'No', exact: true }).click();
    await page.getByLabel('Medical History *').click();
    await page.getByRole('option', { name: 'No', exact: true }).click();
    await page.getByLabel('Type of Insurance *').click();
    await page.getByRole('option', { name: 'Life Insurance', exact: true }).click();
    await page.getByLabel('Coverage Amount Needed *').fill('$500,000');
    await page.getByLabel('Are You Ready to Proceed? *').click();
    await page.getByRole('option', { name: "Yes, I'm ready" }).click();
    await page.getByText('I agree to the privacy policy').click();
    await page.getByText('I am not a robot').click();
    await expect(page.getByTestId('quote-accepted')).toHaveCount(0);
    await page.getByRole('button', { name: 'Get My Quote' }).click();
    await expect.poll(() => acceptedPayload).not.toBeNull();
    await expect(page.getByTestId('quote-accepted')).toHaveCount(0);
    releaseAcceptance?.();
    await expect(page.getByTestId('quote-accepted')).toContainText('ENL-20260801-ABCD1234');
    expect(acceptedPayload).toMatchObject({ email: 'avery@example.test', province: 'AB', insuranceType: 'Life Insurance' });
  });
});

test.describe('Lead and client governance', () => {
  test('follow-up outcomes require every governed field', async ({ page }) => {
    const state = await installPortalMocks(page);
    await page.goto('/management/leads');
    await page.getByLabel('Pipeline stage for Avery Chen').selectOption('FOLLOW_UP_PROSPECT');
    await expect(page.getByRole('heading', { name: 'Record Follow Up Prospect' })).toBeVisible();
    await page.getByLabel('Reason').fill('Requested a later review after renewal season.');
    await page.getByLabel('Next follow-up').fill('2026-09-15T10:30');
    await page.getByLabel('Assigned advisor').selectOption('advisor-1');
    await page.getByLabel('Future-contact consent').selectOption('CONSENTED');
    await page.getByLabel('Outcome notes').fill('Client consented to email and phone follow-up.');
    await page.getByRole('button', { name: 'Save outcome' }).click();
    await expect.poll(() => state.leadPatch?.leadStatus).toBe('FOLLOW_UP_PROSPECT');
    expect(state.leadPatch).toMatchObject({ assignedAdvisorId: 'advisor-1', futureContactConsent: 'CONSENTED' });
  });

  test('ordinary actions archive and restore instead of deleting', async ({ page }) => {
    const state = await installPortalMocks(page);
    await page.goto('/management/leads');
    await page.getByRole('button', { name: 'Archive lead for Avery Chen' }).click();
    await page.getByLabel('Required reason').fill('Duplicate record confirmed during manual review.');
    await page.getByText('I confirm this archive action').click();
    await page.getByRole('button', { name: 'Archive record' }).click();
    await expect.poll(() => state.archived).toBe(true);
    expect(state.archiveReason).toContain('Duplicate record');
    await page.getByLabel('Filter by lead status').selectOption('ARCHIVED');
    await page.getByRole('button', { name: 'Restore lead for Avery Chen' }).click();
    const restoreDialog = page.getByRole('dialog');
    await restoreDialog.getByLabel('Required reason').fill('Owner approved restoration after deduplication review.');
    await restoreDialog.getByRole('checkbox').check();
    await expect(restoreDialog.getByRole('button', { name: 'Restore record' })).toBeEnabled();
    await restoreDialog.getByRole('button', { name: 'Restore record' }).click();
    await expect.poll(() => state.archived).toBe(false);
  });
});

test.describe('Advisor operations', () => {
  test('advisor recruitment stage changes remain in the unified portal', async ({ page }) => {
    const state = await installPortalMocks(page);
    await page.goto('/management/advisors/advisor-1');
    await expect(page.getByRole('heading', { name: 'Jordan Singh' })).toBeVisible();
    await page.getByLabel('Stage').selectOption('ACTIVE_ADVISOR');
    await page.getByRole('button', { name: 'Save workflow' }).click();
    await expect.poll(() => state.advisorPatch?.recruitmentStage).toBe('ACTIVE_ADVISOR');
  });

  test('insurance-company contracts are created and displayed with masked advisor codes', async ({ page }) => {
    const state = await installPortalMocks(page);
    await page.goto('/management/advisors/advisor-1');
    await page.getByRole('button', { name: 'Add contract' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Insurance company').fill('Verified Life Canada');
    await dialog.getByLabel('Advisor code').fill('ADV-2468');
    await dialog.getByLabel('Sponsorship status').selectOption('ACTIVE');
    await dialog.getByLabel('Effective date').fill('2026-08-01');
    await dialog.getByRole('button', { name: 'Add contract' }).click();
    await expect.poll(() => state.contractBody?.companyName).toBe('Verified Life Canada');
    await expect(page.getByText('••••2468')).toBeVisible();
    await expect(page.getByText('ADV-2468')).toHaveCount(0);
  });

  test('licence and policy numbers stay masked in list views', async ({ page }) => {
    await installPortalMocks(page);
    await page.goto('/management/compliance');
    await expect(page.getByText('••••1234')).toBeVisible();
    await expect(page.getByText('••••5678')).toBeVisible();
    await expect(page.getByText('••••9876')).toBeVisible();
    await expect(page.getByText('LICENCE-UNMASKED-1234')).toHaveCount(0);
  });

  test('licence reminder rules retain the approved 90, 60, 30, and 7-day schedule without auto-enabling', async ({ page }) => {
    const state = await installPortalMocks(page);
    await page.goto('/management/compliance');
    await page.getByRole('button', { name: 'Reminder rule' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByPlaceholder('Province').fill('AB');
    await dialog.getByPlaceholder('Licence type').fill('Life');
    await dialog.getByPlaceholder('Verified deadline rule').fill('Use the owner-verified Alberta renewal deadline.');
    await dialog.getByPlaceholder('Regulator').fill('Verified regulator');
    await dialog.getByRole('button', { name: 'Save rule' }).click();
    await expect.poll(() => state.reminderBody?.reminderDays).toEqual([90, 60, 30, 7]);
    expect(state.reminderBody?.enableAutomaticScheduling).toBeUndefined();
    await expect(page.getByText('Reminders: 90, 60, 30, 7 days')).toBeVisible();
    await expect(page.getByText('Draft', { exact: true })).toBeVisible();
  });

  for (const area of [
    { name: 'compliance', path: '/management/compliance' },
    { name: 'commissions', path: '/management/commissions' },
    { name: 'reports', path: '/management/reports' },
  ]) {
    test(`non-privileged roles cannot open sensitive ${area.name} data`, async ({ page }) => {
      await page.route('**/api/auth/me', (route) => fulfillJson(route, { success: true, user: { ...adminUser, role: 'MARKETING' } }));
      await page.route('**/api/crm?*', (route) => fulfillJson(route, { message: 'Administrator or manager access is required.' }, 403));
      await page.goto(area.path);
      await expect(page).toHaveURL(/\/management\/access-denied$/);
      await expect(page.getByRole('heading', { name: 'Management access required' })).toBeVisible();
    });
  }
});

test.describe('Email, notifications, and reports', () => {
  test('email preview does not send before explicit confirmation', async ({ page }) => {
    const state = await installPortalMocks(page);
    await page.goto('/management/email');
    await page.getByLabel('Database recipient').selectOption('contact-1');
    await page.getByLabel('BCC').fill('');
    await page.getByRole('button', { name: 'Apply template' }).click();
    await page.getByRole('button', { name: 'Preview', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Email preview' })).toBeVisible();
    expect(state.emailActions).toEqual(['SAVE_DRAFT', 'PREVIEW']);
    await expect(page.getByText('BCC: kanwar@estatenest.ca')).toBeVisible();
    await page.getByText('I reviewed the recipients').click();
    await page.getByRole('button', { name: 'Send with Gmail' }).click();
    await expect.poll(() => state.emailActions.includes('SEND')).toBe(true);
  });

  test('commission template uses the corrected policy-ending subject', async ({ page }) => {
    await installPortalMocks(page);
    await page.goto('/management/email');
    await page.getByLabel('Message type').selectOption('COMMISSION');
    await page.getByLabel('Database recipient').selectOption('advisor-1');
    await page.getByLabel('Policy last four').fill('2468');
    await page.getByRole('button', { name: 'Apply template' }).click();
    await expect(page.getByLabel('Subject')).toHaveValue('Commission Payment Notification – Policy ending 2468');
    await expect(page.getByLabel('Body')).toHaveValue(/Masked policy number: ••••2468/);
  });

  test('unapproved attachment types are blocked', async ({ page }) => {
    await installPortalMocks(page);
    await page.goto('/management/email');
    await page.getByLabel('Database recipient').selectOption('contact-1');
    await page.getByRole('button', { name: 'Apply template' }).click();
    await page.getByLabel('Add approved attachment').setInputFiles({ name: 'malware.exe', mimeType: 'application/x-msdownload', buffer: Buffer.from('not-an-executable') });
    await expect(page.getByText('Attachment type is not approved or exceeds the 10 MiB limit.', { exact: true })).toBeVisible();
  });

  test('failed Gmail notifications preserve the CRM lead and can retry', async ({ page }) => {
    const state = await installPortalMocks(page);
    await page.goto('/management/notifications');
    await expect(page.getByRole('link', { name: 'ENL-20260801-ABCD1234' })).toHaveAttribute('href', '/management/leads/lead-1');
    await expect(page.getByText('Gmail SMTP temporarily unavailable.')).toBeVisible();
    await page.getByRole('button', { name: 'Retry Gmail' }).click();
    await expect.poll(() => state.notificationRetried).toBe(true);
    expect(state.lead.id).toBe('lead-1');
  });

  test('reports preview before confirmed delivery', async ({ page }) => {
    const state = await installPortalMocks(page);
    await page.goto('/management/reports');
    await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible();
    await page.getByRole('button', { name: 'Preview report' }).click();
    await expect(page.getByText('ENL-20260801-ABCD1234')).toBeVisible();
    await page.getByRole('button', { name: 'Send summary' }).click();
    expect(state.reportActions).toEqual(['PREVIEW']);
    await page.getByText('I reviewed the report filters').click();
    await page.getByRole('button', { name: 'Send summary' }).last().click();
    await expect.poll(() => state.reportActions.includes('SEND')).toBe(true);
    expect(state.reportBodies.find((body) => body.action === 'SEND')).toMatchObject({ previewRunId: 'report-preview-1' });
  });
});
