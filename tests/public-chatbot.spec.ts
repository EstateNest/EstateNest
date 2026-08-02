import { expect, test, type Page, type Route } from '@playwright/test';

interface ChatbotMockState {
  actions: string[];
  prospectCount: number;
  confirmRequests: number;
  notificationStatus: 'SENT' | 'FAILED';
  selectedInterests: string[];
  handoffCreated: boolean;
  quotePayload: Record<string, unknown> | null;
  authRequests: number;
}

async function json(route: Route, payload: unknown, status = 200) {
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(payload) });
}

async function installMocks(
  page: Page,
  notificationStatus: 'SENT' | 'FAILED' = 'SENT',
  startResponse: Record<string, unknown> = {},
): Promise<ChatbotMockState> {
  const state: ChatbotMockState = {
    actions: [],
    prospectCount: 0,
    confirmRequests: 0,
    notificationStatus,
    selectedInterests: [],
    handoffCreated: false,
    quotePayload: null,
    authRequests: 0,
  };

  await page.addInitScript(() => {
    const analyticsWindow = window as Window & { __chatbotEvents?: unknown[]; dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; clarity?: ((...args: unknown[]) => void) & { q?: unknown[] } };
    analyticsWindow.__chatbotEvents = [];
    analyticsWindow.dataLayer = [];
    analyticsWindow.gtag = (...args: unknown[]) => analyticsWindow.__chatbotEvents?.push(args);
    const clarity = (...args: unknown[]) => analyticsWindow.__chatbotEvents?.push(args);
    clarity.q = [];
    analyticsWindow.clarity = clarity;
  });
  for (const analyticsUrl of [
    'https://www.googletagmanager.com/**',
    'https://www.google-analytics.com/**',
    'https://*.google-analytics.com/**',
    'https://*.analytics.google.com/**',
    'https://*.clarity.ms/**',
    'https://c.bing.com/**',
  ]) {
    await page.route(analyticsUrl, (route) => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  }

  await page.route('**/api/auth/**', async (route) => {
    state.authRequests += 1;
    await json(route, { success: false }, 401);
  });
  await page.route('**/api/chatbot**', async (route) => {
    const request = route.request();
    if (request.method() === 'GET') {
      if (!state.handoffCreated) return json(route, { success: false, message: 'No secure chatbot handoff is available.' }, 404);
      return json(route, {
        success: true,
        leadReference: 'ENL-20260802-CHATBOT',
        prefill: {
          firstName: 'Avery',
          lastName: 'Chen',
          email: 'avery@example.test',
          phone: '+17805550100',
          province: '',
          insuranceType: 'Life Insurance',
        },
      });
    }

    const body = request.postDataJSON() as Record<string, unknown>;
    const action = String(body.action || '');
    state.actions.push(action);
    if (action === 'start') {
      return json(route, { success: true, sessionId: 'session-public-1', status: 'CONSENTED', resumed: false, ...startResponse }, startResponse.resumed ? 200 : 201);
    }
    if (action === 'confirm-contact') {
      state.confirmRequests += 1;
      state.prospectCount = 1;
      return json(route, {
        success: true,
        accepted: true,
        prospectReference: 'ENL-20260802-CHATBOT',
        duplicate: false,
        notificationStatus: state.notificationStatus,
      }, 201);
    }
    if (action === 'interests') {
      state.selectedInterests = Array.isArray(body.interests) ? body.interests.map(String) : [];
      return json(route, { success: true, interests: state.selectedInterests });
    }
    if (action === 'handoff') {
      state.handoffCreated = true;
      return json(route, { success: true, destination: '/quote', expiresIn: 1200 }, 201);
    }
    if (['follow-up', 'end', 'abandon'].includes(action)) return json(route, { success: true, status: action.toUpperCase() });
    return json(route, { success: false, message: 'Unknown action' }, 404);
  });
  await page.route('**/api/submit-quote', async (route) => {
    state.quotePayload = route.request().postDataJSON() as Record<string, unknown>;
    await json(route, {
      success: true,
      accepted: true,
      chatbotLinked: true,
      duplicate: false,
      leadReference: 'ENL-20260802-CHATBOT',
      message: 'Your quote request has been securely accepted.',
    });
  });

  return state;
}

async function openAndConsent(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open Estate Nest insurance assistant' }).click();
  const panel = page.getByTestId('insurance-assistant-panel');
  await expect(panel).toBeVisible();
  await panel.getByRole('button', { name: 'Agree and Continue' }).click();
  await expect(panel.getByLabel('May I have your full name?')).toBeVisible();
  return panel;
}

async function completeContact(page: Page) {
  const panel = await openAndConsent(page);
  await panel.getByLabel('May I have your full name?').fill('Avery Chen');
  await panel.getByRole('button', { name: 'Continue' }).click();
  await panel.getByLabel(/best phone number/i).fill('780-555-0100');
  await panel.getByRole('button', { name: 'Continue' }).click();
  await panel.getByLabel(/email address should we use/i).fill('avery@example.test');
  await panel.getByRole('button', { name: 'Continue' }).click();
  await expect(panel).toContainText('Please confirm your contact details');
  await panel.getByRole('button', { name: 'Confirm' }).click();
  await expect(panel).toContainText('Secure prospect reference: ENL-20260802-CHATBOT');
  return panel;
}

test.describe('Estate Nest public insurance assistant', () => {
  test('requires consent before personal fields and supports Not Now', async ({ page }) => {
    const state = await installMocks(page);
    await page.goto('/');
    const launcher = page.getByRole('button', { name: 'Open Estate Nest insurance assistant' });
    await expect(launcher).toBeVisible();
    await launcher.click();
    const panel = page.getByTestId('insurance-assistant-panel');
    await expect(panel).toContainText('Please do not enter medical, banking or other sensitive information');
    await expect(panel.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy');
    await expect(panel.getByLabel('May I have your full name?')).toHaveCount(0);
    await expect(panel.getByLabel(/occasional Estate Nest insurance updates/i)).not.toBeChecked();
    await panel.getByRole('button', { name: 'Not Now' }).click();
    await expect(panel).toContainText('Thank you for your valuable time');
    await expect(panel.getByRole('link', { name: 'Call 780-860-3191' })).toHaveAttribute('href', 'tel:780-860-3191');
    expect(state.actions).toEqual([]);
  });

  test('resumes a securely confirmed session without creating another start', async ({ page }) => {
    const state = await installMocks(page, 'SENT', {
      status: 'CONTACT_CONFIRMED',
      resumed: true,
      prospectReference: 'ENL-20260802-RESUMED',
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'Open Estate Nest insurance assistant' }).click();
    const panel = page.getByTestId('insurance-assistant-panel');
    await panel.getByRole('button', { name: 'Agree and Continue' }).click();

    await expect(panel).toContainText('What type of insurance or financial protection would you like information about today?');
    await expect(panel).toContainText('Secure prospect reference: ENL-20260802-RESUMED');
    await expect(panel.getByLabel('May I have your full name?')).toHaveCount(0);
    expect(state.actions).toEqual(['start']);
  });

  test('validates each contact field and creates no prospect before confirmation', async ({ page }) => {
    const state = await installMocks(page);
    const panel = await openAndConsent(page);
    expect(state.actions).toEqual(['start']);
    expect(state.prospectCount).toBe(0);

    await panel.getByLabel('May I have your full name?').fill('<script>alert(1)</script>');
    await panel.getByRole('button', { name: 'Continue' }).click();
    await expect(panel.getByRole('alert')).toContainText('please do not enter medical, banking, identification');
    await panel.getByLabel('May I have your full name?').fill("Anne-Marie O’Neil");
    await panel.getByRole('button', { name: 'Continue' }).click();
    await panel.getByLabel(/best phone number/i).fill('555');
    await panel.getByRole('button', { name: 'Continue' }).click();
    await expect(panel.getByRole('alert')).toContainText('valid 10-digit');
    await panel.getByLabel(/best phone number/i).fill('780-555-0100');
    await panel.getByRole('button', { name: 'Continue' }).click();
    await panel.getByLabel(/email address should we use/i).fill('invalid-email');
    await panel.getByRole('button', { name: 'Continue' }).click();
    await expect(panel.getByRole('alert')).toContainText('valid email address');
    await panel.getByLabel(/email address should we use/i).fill('anne@example.test');
    await panel.getByRole('button', { name: 'Continue' }).click();
    expect(state.prospectCount).toBe(0);
    await panel.getByRole('button', { name: 'Edit' }).click();
    await expect(panel.getByLabel('May I have your full name?')).toHaveValue("Anne-Marie O’Neil");
  });

  test('preserves the prospect when Gmail delivery fails and prevents double confirmation', async ({ page }) => {
    const state = await installMocks(page, 'FAILED');
    const panel = await openAndConsent(page);
    await panel.getByLabel('May I have your full name?').fill('Avery Chen');
    await panel.getByRole('button', { name: 'Continue' }).click();
    await panel.getByLabel(/best phone number/i).fill('780-555-0100');
    await panel.getByRole('button', { name: 'Continue' }).click();
    await panel.getByLabel(/email address should we use/i).fill('avery@example.test');
    await panel.getByRole('button', { name: 'Continue' }).click();
    const confirm = panel.getByRole('button', { name: 'Confirm' });
    await confirm.click();
    await expect(panel).toContainText('Secure prospect reference: ENL-20260802-CHATBOT');
    expect(state.prospectCount).toBe(1);
    expect(state.confirmRequests).toBe(1);
    expect(state.notificationStatus).toBe('FAILED');
  });

  test('supports multi-select, Not Sure exclusivity, deterministic FAQ, and closing flow', async ({ page }) => {
    const state = await installMocks(page);
    const panel = await completeContact(page);
    const life = panel.getByRole('button', { name: 'Life Insurance' });
    const critical = panel.getByRole('button', { name: 'Critical Illness Insurance' });
    const notSure = panel.getByRole('button', { name: 'Not Sure Yet' });
    await life.click();
    await critical.click();
    await expect(life).toHaveAttribute('aria-pressed', 'true');
    await expect(critical).toHaveAttribute('aria-pressed', 'true');
    await notSure.click();
    await expect(notSure).toHaveAttribute('aria-pressed', 'true');
    await expect(life).toHaveAttribute('aria-pressed', 'false');
    await notSure.click();
    await life.click();
    await critical.click();
    await panel.getByRole('button', { name: 'Save Interests' }).click();
    expect(state.selectedInterests).toEqual(['LIFE_INSURANCE', 'CRITICAL_ILLNESS']);
    await panel.getByRole('button', { name: 'Ask a General Question' }).click();
    await panel.getByRole('button', { name: 'Life Insurance' }).click();
    await panel.getByRole('button', { name: 'What is term life insurance?' }).click();
    await expect(panel).toContainText('provides coverage for a defined period');
    await expect(panel).toContainText('not legal, tax, medical or individualized insurance advice');
    await panel.getByRole('button', { name: 'Request Advisor Follow-Up' }).click();
    await expect(panel).toContainText('Your enquiry has been received');
    expect(state.prospectCount).toBe(1);
  });

  test('uses a PII-free URL handoff, prefills editable fields, and links quote submission', async ({ page }) => {
    const state = await installMocks(page);
    const panel = await completeContact(page);
    await panel.getByRole('button', { name: 'Life Insurance' }).click();
    await panel.getByRole('button', { name: 'Save Interests' }).click();
    await panel.getByRole('button', { name: 'Continue to Quote Request' }).click();

    await expect(page).toHaveURL(/\/quote$/);
    expect(new URL(page.url()).search).toBe('');
    await expect(page.getByTestId('chatbot-prefill-notice')).toBeVisible();
    await expect(page.getByLabel('First Name *')).toHaveValue('Avery');
    await expect(page.getByLabel('Last Name *')).toHaveValue('Chen');
    await expect(page.getByLabel('Email Address *')).toHaveValue('avery@example.test');
    await expect(page.getByLabel('Phone Number *')).toHaveValue('+17805550100');
    await expect(page.getByLabel('Type of Insurance *')).toContainText('Life Insurance');
    await page.getByLabel('First Name *').fill('Averie');
    await page.getByLabel('Province *').click();
    await page.getByRole('option', { name: 'Alberta' }).click();
    await page.getByLabel('Smoking History *').click();
    await page.getByRole('option', { name: 'No', exact: true }).click();
    await page.getByLabel('Medical History *').click();
    await page.getByRole('option', { name: 'No', exact: true }).click();
    const coverageAmount = page.getByLabel('Coverage Amount Needed *');
    await coverageAmount.click();
    await coverageAmount.pressSequentially('500000');
    await expect(coverageAmount).toHaveValue('500000');
    await page.getByLabel('Are You Ready to Proceed? *').click();
    await page.getByRole('option', { name: "Yes, I'm ready" }).click();
    await page.getByText('I agree to the privacy policy').click();
    await page.getByText('I confirm the information above is accurate').click();
    await page.getByRole('button', { name: 'Get My Quote' }).click();
    await expect(page.getByTestId('quote-accepted')).toContainText('ENL-20260802-CHATBOT');
    expect(state.prospectCount).toBe(1);
    expect(state.quotePayload).toMatchObject({ firstName: 'Averie', email: 'avery@example.test', insuranceType: 'Life Insurance' });

    const analytics = await page.evaluate(() => JSON.stringify((window as Window & { __chatbotEvents?: unknown[] }).__chatbotEvents || []));
    expect(analytics).toContain('chatbot_quote_completed');
    expect(analytics).not.toContain('avery@example.test');
    expect(analytics).not.toContain('7805550100');
  });

  test('traps focus, masks contact fields, returns focus, and avoids critical errors', async ({ page }) => {
    const state = await installMocks(page);
    const criticalErrors: string[] = [];
    page.on('pageerror', (error) => criticalErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error' && !message.text().includes('favicon')) criticalErrors.push(message.text());
    });
    const panel = await openAndConsent(page);
    const name = panel.getByLabel('May I have your full name?');
    await expect(name).toHaveAttribute('data-clarity-mask', 'true');
    await page.keyboard.press('Shift+Tab');
    expect(await panel.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Open Estate Nest insurance assistant' })).toBeFocused();
    expect(state.authRequests).toBe(0);
    expect(criticalErrors).toEqual([]);
  });

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ]) {
    test(`fits the ${viewport.width}x${viewport.height} viewport without horizontal overflow`, async ({ page }) => {
      await installMocks(page);
      await page.setViewportSize(viewport);
      await page.goto('/');
      await page.getByRole('button', { name: 'Open Estate Nest insurance assistant' }).click();
      const panel = page.getByTestId('insurance-assistant-panel');
      await expect(panel).toBeVisible();
      const panelBox = await panel.boundingBox();
      expect(panelBox).not.toBeNull();
      expect(panelBox!.x).toBeGreaterThanOrEqual(0);
      expect(panelBox!.x + panelBox!.width).toBeLessThanOrEqual(viewport.width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  }
});
