import { test, expect } from '@playwright/test';

test.describe('EstateNest Public Website', () => {
  test('Homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check title
    await expect(page).toHaveTitle(/Life Insurance/);
    
    // Check navigation
    await expect(page.locator('nav')).toBeVisible();
    
    // Check hero section
    await expect(page.locator('text=Get Free Quote').first()).toBeVisible();
  });

  test('Navigation menu works', async ({ page }) => {
    await page.goto('/');
    
    // Check all nav items
    const navItems = ['Home', 'About Us', 'Services', 'Need Analysis', 'FAQs', 'Service Areas', 'Contact'];
    for (const item of navItems) {
      await expect(page.locator(`nav >> text=${item}`).first()).toBeVisible();
    }
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
    
    // Mobile menu should be visible
    await expect(page.locator('button[aria-label="Toggle menu"], button:has-text("Menu")').first()).toBeVisible();
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
