# Estate Nest Engineering Guardrails

## Scope and Architecture

- These instructions apply to the entire repository.
- Production uses Vite, React 18, TypeScript, React Router, Tailwind CSS, Hono/Vercel Functions, Supabase, and Playwright.
- Do not introduce Next.js runtime patterns or `@supabase/ssr` unless an explicitly approved migration replaces the Vite application.
- Keep the public website, management CRM, Supabase authentication, Gmail SMTP, analytics, and Vercel behavior intact unless a task explicitly changes them.

## Product Priorities

- `https://www.estatenest.ca/quote` is the primary public conversion destination.
- The CRM is the system of record for leads, contacts, advisors, compliance, tasks, documents, commissions, and workflow history.
- Preserve deep links and reliable browser history throughout `/management/*`.
- Optimize for trust, clarity, accessibility, mobile usability, and an easy path to a licensed advisor.
- Never invent or exaggerate ratings, reviews, licences, coverage placed, client counts, carrier relationships, awards, or regulatory standing. Obtain owner verification before publishing or retaining a quantified claim.

## Design Change Control

- `DESIGN.md` is the visual and interaction source of truth.
- UI/UX Pro Max and GPT Taste may audit and recommend. They must not independently redesign the public website, replace Estate Nest branding, add a generic template, or override verified business functionality.
- Recommendation comes first. Record the finding, rationale, affected pages, accessibility impact, conversion impact, and regression risk before implementation.
- The installed `gpt-taste` skill is advisory only. Its random layouts, mandatory GSAP, external stock imagery, font bans, giant spacing, and automatic AIDA rules do not override this file or `DESIGN.md`.
- Do not add GSAP, animation libraries, remote image services, or new fonts without measured need, reduced-motion behavior, performance review, and owner approval.
- Preserve the current blue/cyan/coral palette until an explicitly approved brand review replaces it.

## Accessibility and Conversion

- Use semantic links for navigation and buttons for actions; never nest interactive controls.
- Give icon-only controls accessible names and expose expanded/collapsed state.
- Maintain visible keyboard focus, logical focus order, form labels, inline errors, and status announcements.
- Use at least 44-by-44-pixel touch targets for primary mobile controls.
- Test representative 375, 768, 1024, and 1440 pixel widths with no horizontal overflow.
- Every primary quote CTA must resolve to `/quote`; never place medical disclosures or other sensitive data in URL query parameters.

## Development Tools

- Playwright tests are committed release gates. Cover conversion, management authentication, protected routing, browser back behavior, logout, keyboard access, and mobile navigation.
- Context7 is development-only. Use its CLI or MCP for current documentation, but never add it as an application dependency or require it at build/runtime.
- UI/UX Pro Max and GPT Taste are development-only and constrained by Design Change Control.
- GEO Optimizer is audit-only until Phase 2. Never run `geo fix --apply` against this repository.

## AI and Crawling Phase Boundaries

- Do not implement Dify, Crawl4AI, or Firecrawl during Phase 1 CRM stabilization.
- Dify may later support approved-source FAQ retrieval, lead classification, summaries, drafts, task suggestions, page routing, and `/quote` handoff. It must not bind coverage, underwrite, autonomously advise, publish without review, or overwrite CRM records without authorization.
- Crawl4AI is the future primary crawler; Firecrawl is fallback-only for approved sources Crawl4AI cannot reliably process.
- Crawlers must respect robots and site terms, preserve provenance, avoid personal-data harvesting and automatic outreach, and create `RESEARCHED_PROSPECT` records only. Human review or voluntary engagement is required before `QUALIFIED_LEAD`.
- See `docs/PLATFORM_ROADMAP.md` for the full phased gates.

## Security and Privacy

- Never commit credentials, app passwords, Supabase secret keys, database passwords, session cookies, or production environment exports.
- Do not expose privileged Supabase clients to the browser or weaken Row Level Security.
- Do not log passwords, session tokens, medical details, or unnecessary personal information.
- Do not weaken CSP, authentication, authorization, rate limits, or audit logging to make a test pass.
- A notification failure must not delete an accepted lead; preserve the record and log a sanitized delivery failure.

## Validation and Deployment

- Start with focused tests, then run `npm run typecheck`, `npm run lint`, `npm run build`, and relevant Playwright projects.
- If documented pre-existing project-wide typecheck or lint debt prevents a clean result, do not hide it or expand scope casually. Ensure every touched file passes focused lint, the production build passes, required Playwright journeys pass, and no new baseline error is introduced; schedule the unrelated debt separately.
- Use a feature branch and Vercel preview for material changes. Verify routes and the lead funnel before production promotion.
- GEO, AI, crawler, schema, regulated-content, and quantified-claim changes require human review before production.
- Do not merge or deploy if changed-file checks, required tests, the production build, security checks, or an applicable release gate fails.
