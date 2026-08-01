# Estate Nest Platform Roadmap and Release Gates

## Phase 1: CRM and Conversion Stability

Build now:

- Commit repeatable Playwright coverage for the public website, `/quote`, management authentication, management tabs, protected routes, browser history, logout, keyboard access, and mobile navigation.
- Use UI/UX Pro Max for controlled recommendations on hierarchy, spacing, forms, tables, modals, empty states, errors, focus, contrast, labels, and touch targets.
- Use Context7 only during development for current framework documentation.
- Preserve Estate Nest branding and verified behavior; broad redesigns and automatic template replacement are outside this phase.

Release gate:

- Public and management routes do not return application 404s.
- Browser back stays within management history when appropriate.
- Logout clears the session and exposes the `Estate Nest Home` return link.
- Every primary quote CTA reaches `/quote` on desktop and mobile.
- Focus order, accessible names, and primary touch targets pass Playwright checks.
- Changed-file lint, production build, focused tests, and preview smoke tests pass. Any pre-existing project-wide typecheck/lint debt is documented, unchanged by the release, and tracked for separate repair.

## Phase 2: GEO Optimizer Audit

Run GEO Optimizer only after Phase 1 is stable. Approved uses include one-page audits, sitemap audits, before/after reports, AI-readiness checks, citability checks, schema recommendations, and optional `llms.txt` evaluation.

Required process:

```text
GEO Optimizer audit
  -> saved report
  -> Codex reviews each recommendation
  -> approved code change on a feature branch
  -> Playwright regression tests
  -> human review
  -> production approval
```

Non-negotiable controls:

- Never run `geo fix --apply` against Estate Nest files.
- No design regression, broken funnel, false schema, duplicate metadata, hidden AI-only content, or fabricated ratings, reviews, licences, awards, or metrics.
- Playwright remains active alongside GEO checks.
- Audit recommendations do not become production changes without pull-request review.

## Phase 3: Dify AI Layer

Dify is the AI workflow and approved-knowledge layer, not the CRM or underwriting system.

Approved functions:

- Public insurance FAQ assistant.
- Internal advisor assistant using explicitly authorized data.
- Approved-source retrieval with source provenance.
- Lead classification, conversation summaries, follow-up drafts, task suggestions, content drafts, page routing, and quote handoff.

Prohibited functions:

- Binding quotes, insurance approval, underwriting decisions, or premium calculations without approved carrier data.
- Autonomous personalized regulated advice or autonomous public publishing.
- Overwriting official CRM records without authorization and human review.
- Collecting unnecessary medical information in a public chat.
- Accessing CRM data unless the specific workflow is explicitly authorized.

Public assistant requirements:

- Limit answers to approved general topics such as life, critical illness, disability, travel, business insurance, beneficiaries, application process, and underwriting concepts.
- State that information is general, eligibility and pricing depend on insurer underwriting and policy terms, the response is not legal/tax/medical/individualized insurance advice, and a licensed advisor should confirm recommendations.
- Use `https://www.estatenest.ca/quote` as the primary handoff.
- Permitted non-sensitive context includes `source=ai_assistant`, an insurance interest, and province. Never place health disclosures or sensitive data in query parameters.

Release gate:

- Answers come only from approved sources, provenance is retained where feasible, the CRM remains the system of record, public content is human-approved, and the `/quote` handoff passes Playwright.

## Phase 4: Crawl4AI with Firecrawl Fallback

Crawl4AI is the self-hosted primary crawler. Firecrawl is used only for approved JavaScript-heavy pages, URL mapping, structured extraction, controlled search, or pages Crawl4AI cannot reliably process. Do not duplicate every crawl through both systems.

Approved research:

- EstateNest.ca audits, public regulator pages, approved public insurance resources, public product information, competitor feature analysis, internal knowledge ingestion, content-gap research, and public company-level research.

Prohibited collection and action:

- Personal email or private phone harvesting, scraping private individuals, bypassing protections, prohibited social-network scraping, unrelated sensitive data, treating crawled data as verified, and automated unsolicited outreach.

Every source registry record must include:

- Domain, source type, approval status, crawl scope, update frequency, retention period, allowed data types, prohibited data types, and last crawl status.

Every crawler-created CRM record begins as `RESEARCHED_PROSPECT`, includes provenance, and remains unqualified until human review or voluntary engagement. An engaged record may become `QUALIFIED_LEAD`; an onboarded qualified lead may become `CLIENT`.

Release gate:

- Robots and site terms are respected, domains are approved, no personal-data harvesting occurs, provenance and retention are enforced, duplicates are handled, outreach is manual/authorized, and crawler failures cannot affect the CRM or public website.
