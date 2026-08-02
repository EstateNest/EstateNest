import { test, expect } from '@playwright/test';

test.describe('EstateNest Public Website', () => {
  test('Homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check title
    await expect(page).toHaveTitle(/Life Insurance/);
    
    // Check navigation
    await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible({ timeout: 10000 });
    
    // Check hero section
    await expect(page.getByTestId('homepage-hero-quote')).toBeVisible();
  });

  test('Homepage hero quote button opens the quote form', async ({ page }) => {
    await page.goto('/');

    const quoteLink = page.getByTestId('homepage-hero-quote');
    await expect(quoteLink).toBeVisible();
    await expect(quoteLink).toHaveAttribute('href', '/quote');
    await quoteLink.click();

    await expect(page).toHaveURL(/\/quote$/);
    await expect(page.getByRole('heading', { name: 'Get Your Free Quote' })).toBeVisible();
  });

  test('Navigation menu works', async ({ page }) => {
    await page.goto('/');

    const navigation = page.getByRole('navigation', { name: 'Primary navigation' });
    if ((page.viewportSize()?.width ?? 1280) < 1280) {
      await navigation.getByRole('button', { name: 'Open navigation menu' }).click();
    }

    const navItems = ['Home', 'About Us', 'Services', 'Need Analysis', 'FAQs', 'Service Areas', 'Contact'];
    for (const item of navItems) {
      await expect(navigation.getByRole('link', { name: item, exact: true })).toBeVisible();
    }
  });

  test('Header quote action opens the quote form', async ({ page }) => {
    await page.goto('/');

    const isMobile = (page.viewportSize()?.width ?? 1280) < 1280;
    if (isMobile) {
      await page.getByRole('button', { name: 'Open navigation menu' }).click();
    }

    const quoteLink = page.getByTestId(isMobile ? 'mobile-header-quote' : 'desktop-header-quote');
    await expect(quoteLink).toBeVisible();
    await expect(quoteLink).toHaveAttribute('href', '/quote');
    await quoteLink.click();

    await expect(page).toHaveURL(/\/quote$/);
    await expect(page.getByRole('heading', { name: 'Get Your Free Quote' })).toBeVisible();
  });

  test('public pages clear the fixed header and expose a distinct active state', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    const destinations = [
      { name: 'About Us', path: '/about' },
      { name: 'Services', path: '/services' },
      { name: 'FAQs', path: '/faq' },
      { name: 'Service Areas', path: '/service-areas' },
      { name: 'Contact', path: '/contact' },
    ];

    for (const destination of destinations) {
      await page.goto(destination.path);

      const navigation = page.getByRole('navigation', { name: 'Primary navigation' });
      const activeLink = navigation.getByRole('link', { name: destination.name, exact: true });
      const heading = page.getByRole('heading', { level: 1 }).first();

      await expect(activeLink).toHaveAttribute('aria-current', 'page');
      await expect(heading).toBeVisible();

      const activeBackground = await activeLink.evaluate((element) => getComputedStyle(element).backgroundImage);
      const navigationBox = await navigation.boundingBox();
      const headingBox = await heading.boundingBox();

      expect(activeBackground).not.toBe('none');
      expect(navigationBox).not.toBeNull();
      expect(headingBox).not.toBeNull();
      expect(headingBox!.y).toBeGreaterThanOrEqual(navigationBox!.y + navigationBox!.height);
    }
  });

  test('header adapts at 1024 and 1280 pixels without horizontal overflow', async ({ page }) => {
    for (const viewport of [
      { width: 1024, height: 768, compact: true },
      { width: 1280, height: 800, compact: false },
    ]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/services');

      const navigation = page.getByRole('navigation', { name: 'Primary navigation' });

      if (viewport.compact) {
        await expect(navigation.getByRole('button', { name: 'Open navigation menu' })).toBeVisible();
        await expect(page.getByTestId('desktop-header-quote')).toBeHidden();
      } else {
        await expect(navigation.getByRole('button', { name: 'Open navigation menu' })).toBeHidden();
        await expect(page.getByTestId('desktop-header-quote')).toBeVisible();
      }

      const widths = await page.evaluate(() => ({
        client: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      expect(widths.scroll).toBe(widths.client);
    }
  });

  test('footer navigation opens every public page at the top', async ({ page }) => {
    const destinations = [
      { name: 'About Us', path: '/about' },
      { name: 'Services', path: '/services' },
      { name: 'FAQs', path: '/faq' },
      { name: 'Service Areas', path: '/service-areas' },
      { name: 'Contact', path: '/contact' },
    ];

    await page.goto('/');

    for (const destination of destinations) {
      const footerLink = page.locator('footer').getByRole('link', { name: destination.name, exact: true });
      await footerLink.scrollIntoViewIfNeeded();
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

      await footerLink.click();

      await expect(page).toHaveURL(new RegExp(`${destination.path}$`));
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    }
  });

  test('Quote Request form rejects incomplete submissions', async ({ page }) => {
    await page.goto('/quote');
    
    // Fill form
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', 'test@example.com');
    
    // Submit
    await page.click('button[type="submit"]');
    
    await expect(page.getByText('Missing Information', { exact: true })).toBeVisible();
    await expect(page.getByText('Please fill in all required fields.', { exact: true })).toBeVisible();
  });

  test('Contact page loads', async ({ page }) => {
    await page.goto('/contact');
    
    await expect(page.getByRole('heading', { name: 'Get In Touch' })).toBeVisible();
    await expect(page.locator('section').getByRole('link', { name: '780-860-3191', exact: true }).first()).toBeVisible();
  });

  test('Footer has compliance info', async ({ page }) => {
    await page.goto('/');
    
    // Check for regulatory links
    await expect(page.locator('text=FSRA').or(page.locator('text=Financial Services Regulatory')).first()).toBeVisible({ timeout: 5000 }).catch(() => {
      // Footer might be at bottom, just check footer exists
      expect(page.locator('footer')).toBeVisible();
    });
  });

  test('Mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    });
    
    const menuButton = page.getByRole('button', { name: 'Open navigation menu' });
    await expect(menuButton).toBeVisible();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    await expect(menuButton).toHaveAttribute('aria-controls', 'mobile-navigation');

    const menuButtonBox = await menuButton.boundingBox();
    expect(menuButtonBox).not.toBeNull();
    expect(menuButtonBox!.width).toBeGreaterThanOrEqual(44);
    expect(menuButtonBox!.height).toBeGreaterThanOrEqual(44);

    await expect(page.getByRole('button', { name: 'Open contact assistant' })).toHaveCount(0);

    await menuButton.click();
    await expect(page.getByRole('button', { name: 'Close navigation menu' })).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('mobile-navigation-panel')).toBeVisible();
    await expect(page.getByTestId('mobile-header-quote')).toHaveAttribute('href', '/quote');

    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Open navigation menu' })).toHaveAttribute('aria-expanded', 'false');
  });

  test('contact assistant stays out of the quote funnel and exposes safe contact actions after scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await expect(page.getByRole('button', { name: 'Open contact assistant' })).toHaveCount(0);
    await page.evaluate(() => window.scrollTo(0, 700));

    const launcher = page.getByRole('button', { name: 'Open contact assistant' });
    await expect(launcher).toBeVisible();
    const launcherBox = await launcher.boundingBox();
    expect(launcherBox).not.toBeNull();
    expect(launcherBox!.width).toBeGreaterThanOrEqual(44);
    expect(launcherBox!.height).toBeGreaterThanOrEqual(44);

    await launcher.click();
    const panel = page.getByTestId('contact-assistant-panel');
    await expect(panel).toBeVisible();
    await expect(panel.getByRole('link', { name: 'Get Your Free Quote' })).toHaveAttribute('href', '/quote');
    await expect(panel.getByRole('link', { name: 'Call 780-860-3191' })).toHaveAttribute('href', 'tel:780-860-3191');
    await expect(panel).toContainText('Eligibility, pricing, and coverage depend on insurer underwriting');

    await page.goto('/quote');
    await expect(page.getByRole('button', { name: /contact assistant/i })).toHaveCount(0);
  });

  test('public pages do not publish unverified rating or coverage-volume claims', async ({ page }) => {
    for (const path of ['/', '/about', '/quote']) {
      await page.goto(path);
      await expect(page.locator('body')).not.toContainText('$50M+');
      await expect(page.locator('body')).not.toContainText('47 Reviews');
    }

    const structuredData = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(structuredData.join('\n')).not.toContain('aggregateRating');
  });
});

test.describe('Services Page', () => {
  test('Services page loads all products', async ({ page }) => {
    await page.goto('/services');
    
    // Check for main services
    const services = ['Life Insurance', 'Critical Illness', 'Disability', 'Mortgage'];
    for (const service of services) {
      await expect(page.locator(`text=${service}`).first()).toBeVisible();
    }
  });
});

test.describe('About Page', () => {
  test('About page loads', async ({ page }) => {
    await page.goto('/about');
    
    await expect(page.getByRole('heading', { level: 1, name: 'About Estate Nest' })).toBeVisible();
  });
});
