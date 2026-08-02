# Estate Nest Phase 1 UI/UX Release Audit

## Scope and Guardrails

This audit applies UI/UX Pro Max recommendations under `AGENTS.md` and `DESIGN.md`. It preserves the Estate Nest blue, cyan, and coral design system; keeps Inter; adds no animation library; does not apply GPT Taste's automatic redesign, GSAP, stock-image, font-replacement, or oversized-spacing rules; and does not change regulated product outcomes.

Playwright remains the release gate across Desktop Chrome and Mobile Safari. Material changes remain on `agent/lead-advisor-management` and Vercel Preview until the separate staging Supabase environment is available.

## Findings and Decisions

| Finding | Rationale | Affected Areas | Accessibility Impact | Conversion Impact | Regression Risk | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| The fixed chat launcher appeared over mobile trust and conversion content. | UI/UX Pro Max requires fixed controls not to obscure content and primary actions. | Home, public pages, quote funnel | Removes a competing floating control and keeps a 44px minimum target when displayed. | Keeps the hero and quote form unobstructed. | Low | Replace the simulated chat with a delayed contact-options panel and hide it on `/quote`. |
| The existing chat simulated an instant AI response without an approved knowledge source. | Phase 1 prohibits introducing the future Dify workflow and public insurance answers must retain approved-source controls. | Public contact assistant | Removes misleading conversational status and provides semantic links. | Sends visitors directly to quote, phone, email, or FAQ. | Low | Use a non-AI contact assistant with a general-information disclosure. |
| A malformed `200` response from `/api/auth/me` could redirect login to the dashboard and leave an indefinite session spinner. | Successful HTTP status alone is insufficient; authenticated payload shape must also be validated. | Management login and dashboard boot | Prevents an unexplained endless loading state. | Restores a clear path back to sign-in instead of appearing broken. | Low | Require a valid user object before redirecting or rendering management. |
| Selecting “No, I need more information” discarded the quote request and returned the visitor home. | A visitor requesting education is still a valid prospect and the backend already supports the lower lead score. | `/quote`, lead funnel | Preserves the user's submitted intent and gives a clear accepted state. | Prevents loss of follow-up prospects. | Medium | Submit both readiness answers; let the CRM score and route the lead. |
| A checkbox labelled “I am not a robot” did not perform real bot verification. | A decorative checkbox must not be represented as a security control. | `/quote` | Replaces deceptive wording with an explicit user confirmation. | Improves trust while retaining deliberate consent. | Low | Add a hidden honeypot, same-origin API enforcement, and accurate confirmation language. |
| Quantified `$50M+`, `5.0`, and `47 reviews` claims lacked owner-supplied verification in the release record. | `AGENTS.md` prohibits publishing or retaining unverified ratings, review counts, and coverage totals; false schema harms SEO/GEO trust. | Home, About, Quote, Footer, metadata, JSON-LD | Replaces compressed numeric cards with readable service and process information. | Trades unsupported social proof for defensible trust signals. | Low | Remove claims and `aggregateRating` until documentary verification is approved. |
| Fixed-header offsets, active navigation, footer-to-top routing, management deep links, browser back, and logout already have passing release coverage. | These were the originally reported navigation defects. | Public pages and `/management/*` | Preserves keyboard focus, `aria-current`, and predictable history. | Prevents 404 and homepage ejection from management. | Low | Retain implementation and strengthen regression tests only where needed. |

## Deferred Human Review

- Verify every licence, E&O, address, social profile, insurer relationship, review, and quantified business claim before publishing it.
- Have Canadian privacy and insurance counsel review the Privacy, Terms, Cookies, quote-consent, and regulated product copy before Production changes.
- Apply and test `supabase/migrations/20260801230000_lead_advisor_management.sql` only in a separate staging Supabase project before Production promotion.
- Keep Dify, Crawl4AI, Firecrawl, and GEO automatic fixes outside Phase 1.

## Release Gates

1. Focused lint and TypeScript checks pass for touched files.
2. Production build passes.
3. Desktop Chrome and Mobile Safari Playwright suites pass.
4. Vercel Preview is built from the reviewed feature-branch commit.
5. Quote acceptance, management login, MFA, Gmail failure preservation, and CRM workflows pass against staging services.
6. No Production merge, migration, or deployment occurs while a release gate is incomplete.
