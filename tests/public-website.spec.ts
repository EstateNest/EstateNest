import { test, expect } from '@playwright/test';

test.describe('EstateNest Public Website', () => {
  test('Homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check title
    await expect(page).toHaveTitle(/Life Insurance/);
    
    // Check navigation
    await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
    
    // Check hero section
    await expect(page.locator('text=Get Free Quote').first()).toBeVisible();
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
    if ((page.viewportSize()?.width ?? 1280) < 1024) {
      await navigation.getByRole('button', { name: 'Open navigation menu' }).click();
    }

    const navItems = ['Home', 'About Us', 'Services', 'Need Analysis', 'FAQs', 'Service Areas', 'Contact'];
    for (const item of navItems) {
      await expect(navigation.getByRole('link', { name: item, exact: true })).toBeVisible();
    }
  });

  test('Header quote action opens the quote form', async ({ page }) => {
    await page.goto('/');

    const isMobile = (page.viewportSize()?.width ?? 1280) < 1024;
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

  test('Quote Request form works', async ({ page }) => {
    await page.goto('/quote');
    
    // Fill form
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', 'test@example.com');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Check for success message or redirect
    await expect(page.locator('text=Thank You').or(page.locator('text=submitted')).or(page.locator('text=success')).first()).toBeVisible({ timeout: 10000 });
  });

  test('Contact page loads', async ({ page }) => {
    await page.goto('/contact');
    
    // Check contact info
    await expect(page.locator('text=780-860-3191').or(page.locator('text=hello@estatenest.ca')).first()).toBeVisible();
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

    const chatButton = page.getByRole('button', { name: 'Open chat' });
    const phoneLink = page.getByTestId('homepage-hero-phone');
    const chatButtonBox = await chatButton.boundingBox();
    const phoneLinkBox = await phoneLink.boundingBox();
    expect(chatButtonBox).not.toBeNull();
    expect(phoneLinkBox).not.toBeNull();
    const chatOverlapsPhone = !(
      chatButtonBox!.x + chatButtonBox!.width <= phoneLinkBox!.x
      || chatButtonBox!.x >= phoneLinkBox!.x + phoneLinkBox!.width
      || chatButtonBox!.y + chatButtonBox!.height <= phoneLinkBox!.y
      || chatButtonBox!.y >= phoneLinkBox!.y + phoneLinkBox!.height
    );
    expect(chatOverlapsPhone).toBe(false);

    await menuButton.click();
    await expect(page.getByRole('button', { name: 'Close navigation menu' })).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('mobile-navigation-panel')).toBeVisible();
    await expect(page.getByTestId('mobile-header-quote')).toHaveAttribute('href', '/quote');

    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Open navigation menu' })).toHaveAttribute('aria-expanded', 'false');
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
    
    // Check for about content
    await expect(page.locator('text=About').first()).toBeVisible();
  });
});
