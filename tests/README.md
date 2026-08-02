# EstateNest End-to-End Testing Guide

## Overview

This directory contains Playwright tests for EstateNest:
- **Public Website Tests** - `public-website.spec.ts`
- **CRM Tests** - `crm.spec.ts`
- **Lead and Advisor Management Tests** - `lead-advisor-management.spec.ts`

## Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

## Running Tests

### All Tests
```bash
npm test
```

### Public Website Only
```bash
npx playwright test public-website.spec.ts
```

### CRM Tests Only
```bash
npx playwright test crm.spec.ts
```

### Lead and Advisor Operations Only
```bash
npx playwright test lead-advisor-management.spec.ts
```

### Single Test
```bash
npx playwright test --grep "Login"
```

### With UI
```bash
npx playwright test --ui
```

## Environment Variables

```bash
# Production URL (default)
BASE_URL=https://www.estatenest.ca

# Local development
BASE_URL=http://localhost:5173
CRM_URL=http://localhost:8080/management

# API URL (for webhook testing)
API_URL=http://localhost:3001
```

## Test Coverage

### Public Website ✓
- [x] Homepage loads
- [x] Navigation menu
- [x] Quote request form
- [x] Contact page
- [x] Footer compliance info
- [x] Mobile responsive
- [x] Services page
- [x] About page

### CRM ✓
- [x] Login page loads
- [x] Valid login works
- [x] Invalid login shows error
- [x] Unauthenticated redirect
- [x] Dashboard loads (after login)
- [x] Navigation menu
- [x] Lead API integration
- [x] TOTP challenge and enrolment fallback
- [x] Lead outcome governance and archive/restore
- [x] Advisor recruitment, compliance masking, and privilege checks
- [x] Insurance-company contracts with masked advisor codes
- [x] Gmail preview/confirmation, attachment restrictions, and retry
- [x] Report preview token before export, delivery, or scheduling

### API ✓
- [x] Lead creation via webhook
- [x] Contact creation
- [x] Supabase connection
- [x] Database integrity

## Debugging

### View Test Report
```bash
npx playwright show-report
```

### View Screenshots
```bash
ls playwright-report/
```

### Debug Mode
```bash
npx playwright test --debug
```

## CI/CD Integration

### GitHub Actions
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install
      - run: npm test
```

## Continuous Testing

For ongoing monitoring, set up:
1. Scheduled Playwright runs (daily)
2. Vercel Preview deployment tests
3. Slack notifications for failures

## Known Limitations

- Some CRM tests are skipped (marked with `test.skip`)
- These require full API authentication setup
- Run locally for full test coverage
