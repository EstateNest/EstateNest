# Estate Nest Public Chatbot Security and UI/UX Design

## Scope and Release Boundary

This record governs the deterministic public insurance chatbot requested for Estate Nest. It preserves the Vite/React application, Supabase CRM, Gmail SMTP delivery, existing quote form, Inter typography, and the blue/cyan/coral design system.

The work remains on `agent/public-insurance-chatbot` and a Vercel Preview. The attached request expressly prohibits a Production deployment and direct merge to `main`; those controls take precedence over its contradictory closing request to merge and deploy. Dify, Crawl4AI, Firecrawl, and other AI/RAG or crawling runtimes are deferred to a separately approved Phase 3 or Phase 4 review.

## UI/UX Pro Max Recommendation Record

| Finding | Rationale | Affected Pages | Accessibility Impact | Conversion Impact | Regression Risk | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| The existing contact panel cannot perform consent-first lead intake. | Progressive disclosure reduces cognitive load and prevents collection before consent. | All public pages except `/quote` and management routes | One labelled field at a time, inline errors, status announcements, and predictable focus. | Creates a shorter path from enquiry to advisor follow-up. | Medium | Replace the panel contents with a deterministic state-driven intake while retaining the existing launcher pattern. |
| A fixed control can obscure mobile content and cookie controls. | Fixed controls need safe-area spacing and must not overlap primary actions. | Mobile public pages | Maintains a minimum 44-by-44-pixel launcher and zoom-safe panel dimensions. | Keeps public CTAs usable while preserving access to chat. | Medium | Use lower-right safe-area offsets, a compact labelled launcher, full-width mobile sheet dimensions, and hide the launcher on `/quote`. |
| A modal-like panel needs complete keyboard behavior. | Escape, focus trapping, focus return, and semantic names are required for WCAG 2.2 AA operation. | Chatbot panel | Keyboard-only and screen-reader operation becomes deterministic. | Prevents abandonment caused by trapped or lost focus. | Low | Use a labelled `role="dialog"`, focus the first useful control, trap Tab/Shift+Tab, close on Escape, and return focus to the launcher. |
| Contact values could be exposed through session replay or analytics. | Name, phone, email, and raw questions are prohibited analytics payloads. | Chatbot and `/quote` handoff | Privacy masking does not alter labels or form usability. | Improves trust without adding friction. | Low | Mark the personal-information region and fields with `data-clarity-mask="true"`; emit event names and non-identifying step/product codes only. |
| Preview verification or a shared household/office network could exhaust an IP-only start limit and block a legitimate visitor. | Keep the eight-start hourly limit per secure browser fingerprint, reuse a valid HttpOnly session, and retain a separate forty-start hourly ceiling per IP. | Consent start and session recovery | Removes a misleading consent error without changing the visible flow. | Prevents false conversion loss while retaining layered abuse protection. | Low | Verify fresh-browser and same-cookie starts independently; never bypass prospect confirmation, origin checks, or the honeypot. |
| An AI-style free-text experience would exceed the approved knowledge boundary. | Phase 1 requires approved, versioned, deterministic answers and no autonomous advice. | FAQ portion of chatbot | Categorized buttons are easier to navigate and announce. | Provides useful education with a reliable quote/advisor handoff. | Low | Store approved FAQ entries once in a versioned content module and use deterministic category/question selection plus a safe fallback. |
| The generated UI/UX Pro Max design-system suggestion proposed a new typeface and high-saturation block style. | `DESIGN.md` requires Inter, restrained gradients, and the established brand system. | Entire chatbot | Avoids layout shift and inconsistent reading behavior. | Preserves brand recognition and page continuity. | High if adopted | Reject the font/template replacement; apply only its accessibility, progressive-disclosure, touch-target, validation, and motion recommendations. |

## Controlled Conversation Flow

1. Welcome and privacy notice with enquiry consent actions.
2. Create a minimal server session only after `Agree and Continue`.
3. Collect full name, phone, and email one field at a time in browser memory.
4. Display masked confirmation and permit editing.
5. Create or update one CRM prospect only after contact confirmation.
6. Queue and attempt the Gmail notification after the transaction commits.
7. Collect one or more broad insurance interests without making a recommendation.
8. Offer deterministic FAQs, advisor follow-up, end chat, or secure `/quote` handoff.
9. Prefill editable quote fields through a short-lived, one-purpose HttpOnly handoff cookie; never place PII in a URL.
10. Link quote submission to the existing prospect and advance it to `VERIFIED_LEAD` without overwriting source history.

## CRM and Database Mapping

- Existing `contacts` remains the contact system of record.
- Existing `leads` remains the prospect and lead system of record.
- Initial chatbot stage maps to existing `PROSPECT`.
- Quote submission maps to existing `VERIFIED_LEAD`.
- New lead source `CHATBOT` is added to the controlled source list.
- Existing matching open leads are reused by normalized email or phone.
- `lead_source_attributions` preserves chatbot and quote source history.
- `chatbot_sessions` stores lifecycle metadata, selected interests, hashed network identifier, retention deadline, and no raw transcript.
- `consent_records` stores separate enquiry and optional marketing decisions with exact wording/version snapshots.
- `chatbot_handoffs` stores only a token hash, expiry, purpose, and consumption state.
- Existing `quote_notifications` records `NEW_CHATBOT_PROSPECT` delivery and retry state; failure never removes the lead.

## Security and Privacy Controls

- Same-origin validation, SameSite cookies, HttpOnly session and handoff tokens, secure cookies on HTTPS, no-store responses, and server-only Supabase access.
- Hashed-IP rolling session limit, honeypot input, request size and field length limits, duplicate protection, transactional database functions, and sanitized errors.
- Server validation rejects scripts/HTML and likely medical, banking, password, card, government-ID, or SIN disclosures in contact fields.
- No raw FAQ question or conversation transcript is sent to the API or stored.
- Retention defaults to 180 days and is configurable with `CHATBOT_RETENTION_DAYS` within a server-enforced range.
- The chatbot cannot query CRM records, enumerate contacts, or obtain management authorization.
- RLS is enabled on every new public-schema table; only `service_role` receives function execution.

## Analytics and Content

Approved events are `chatbot_opened`, `chatbot_consent_accepted`, `chatbot_contact_completed`, `chatbot_product_selected`, `chatbot_quote_clicked`, `chatbot_quote_completed`, and `chatbot_abandoned`. Parameters are limited to non-identifying step, action, and normalized product codes.

Approved FAQ content lives in one versioned source file. Answers are general information, include the required limitation language, make no eligibility or price promise, and route uncertain or individualized questions to a licensed advisor.

## Release Gates

1. New migration is reviewed and applied only to the staging Supabase project used by Preview.
2. Focused API and component type/lint checks pass.
3. Production build passes.
4. Playwright passes at 390x844, 768x1024, and 1440x900, including consent, validation, dedupe behavior, email-failure preservation, handoff, privacy, keyboard, and no-overflow coverage.
5. Vercel Preview is verified without critical console errors or HTTP 500 responses.
6. Owner and appropriate Canadian privacy/insurance reviewers approve consent, retention, E&O, FAQ, and regulated wording before any later Production promotion.
