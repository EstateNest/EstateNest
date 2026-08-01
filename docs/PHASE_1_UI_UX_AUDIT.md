# Phase 1 UI/UX Recommendation Record

## Method

- Reviewed the current Vite/React routes, management navigation, homepage quote links, header, footer, design tokens, and Playwright coverage.
- Ran UI/UX Pro Max in recommendation-only mode with balanced variance, subtle motion, and standard density.
- Used Context7 as a one-time development query for current Playwright focus, role, link, URL, and mobile-project patterns.
- Did not persist an external design system, rewrite application files, install a production dependency, or run an automatic fixer.

## Accepted Recommendations

- Keep a trust-and-authority visual direction appropriate for insurance and financial services.
- Preserve one prominent quote action and predictable navigation.
- Add a clear escape route from the management login screen to the public homepage.
- Correct semantic link/button composition, mobile menu naming/state, visible focus, and 44-pixel primary touch targets.
- Use subtle 150-300ms state transitions and keep required information available without hover.
- Test keyboard focus and mobile behavior with Playwright.
- Keep unverified trust metrics and regulatory claims out of new content until owner verification.

## Rejected or Deferred Recommendations

- **Green conversion palette:** rejected for this phase because it conflicts with the established Estate Nest coral conversion accent.
- **Automatic font replacement:** deferred to a dedicated typography and performance review.
- **Mandatory GSAP and scroll effects:** rejected for this phase; no measured need justifies a new runtime dependency or motion risk.
- **Automatic badges, reviews, and authority metrics:** prohibited unless each claim is verified.
- **Broad public-site redesign:** prohibited by the Phase 1 guardrail. Improvements remain targeted and regression-tested.

## Current Findings

- `/quote` is correctly wired from the homepage hero, desktop header, mobile header, footer, and lower homepage CTA; existing Playwright coverage verifies the hero route.
- Management tabs have route and browser-back coverage, including an internal fallback for unknown management URLs.
- The management login screen lacks the requested route back to Estate Nest Home.
- The mobile header menu needs an accessible name, expanded state, controlled-region relationship, and a larger touch target.
- When opened at the top of the homepage, the mobile menu is transparent and its links overlap hero copy.
- Header quote CTAs currently nest a button inside a link; this should become one semantic interactive element.
- At a 375-pixel viewport, the floating chat control can overlap the secondary phone CTA near the fold.
- The footer depends on the production domain for its logo; it should use the bundled asset and semantic SVG trust icons.
- Existing quantified claims and review/licensing statements require owner evidence before they are treated as verified content.

## Approved Implementation Scope

1. Add the `Estate Nest Home` back link to management login.
2. Add Playwright coverage for its destination, keyboard focus, and touch size.
3. Correct header navigation semantics and mobile accessibility without changing branding.
4. Render the open mobile menu on an opaque, scroll-safe surface above page content.
5. Use the bundled footer logo and semantic trust icons without changing verified business copy.
6. Reduce and lower the mobile chat control so it does not obstruct the quote or phone actions.
7. Run typecheck, lint, build, desktop/mobile Playwright, and preview smoke tests before deployment.

## Existing Repository Baseline

- Project-wide `npm run typecheck` currently fails in pre-existing calendar, chart, and webhook utility code outside this approved UI scope.
- Project-wide `npm run lint` currently fails in pre-existing shared UI, database/webhook utility, quote analytics, and Tailwind configuration code outside this approved UI scope.
- All touched TypeScript/TSX and Playwright files pass focused ESLint, the Vite production build passes, and the approved Chromium/Mobile Safari journeys pass.
- The baseline debt must be repaired in a separate focused change before Estate Nest claims a zero-error repository-wide typecheck/lint gate.
