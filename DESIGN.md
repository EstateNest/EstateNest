# Estate Nest Design System

## Design Intent

Estate Nest should feel trustworthy, calm, modern, Canadian, and human. Premium quality comes from clarity, consistency, responsive detail, accurate content, and confident restraint rather than decorative excess.

The public experience prioritizes an easy path from education to `Get Free Quote`. The management experience prioritizes fast scanning, predictable navigation, clear statuses, and safe completion of regulated operational work.

## Existing Brand Foundation

- **Primary:** insurance blue, `--primary: 210 100% 40%`.
- **Secondary:** clear cyan-blue, `--secondary: 200 100% 45%`.
- **Conversion accent:** warm coral, `--accent: 15 90% 60%`.
- **Core foreground:** deep slate, `--foreground: 215 25% 15%`.
- **Surfaces:** white with restrained cool-blue muted backgrounds.
- **Typography:** Inter is the current production family. Do not swap fonts incidentally; evaluate readability, loading, layout shift, and brand fit in a dedicated review.
- **Shape:** `0.75rem` base radius with restrained shadows and gradients.

All application colours remain semantic HSL variables in `src/index.css`. Components should use tokens such as `primary`, `accent`, `muted`, and `destructive` instead of adding isolated raw colours.

## Visual Hierarchy

- Use one clear page-level `h1`; section headings follow in order.
- Keep public body copy readable at 16px or larger with comfortable line height and approximately 60-75 characters per desktop line.
- Give the primary quote action the strongest visual emphasis. Phone, calculators, and informational links remain secondary.
- Avoid repeated competing CTAs in a single viewport.
- Use whitespace to group related content; do not add giant cinematic gaps that delay useful insurance information or the quote path.

## Header

- Keep the Estate Nest logo and name visually stable between pages.
- Use an opaque cool-blue header surface so hero or page content never reduces navigation contrast.
- Active navigation uses a restrained blue-to-cyan-to-coral tint plus an underline and `aria-current="page"`; inactive links receive the softer version on hover and focus.
- Make desktop and mobile quote actions resolve to `/quote`.
- Desktop navigation should show the current page and a visible hover/focus state without layout shift.
- The mobile menu control must be at least 44 by 44 pixels, have an accessible name, expose `aria-expanded`, and close after navigation.
- Phone and email details are actionable links where displayed.
- The fixed header must remain legible over the hero and after scrolling.

## Footer

- Reuse the bundled Estate Nest logo rather than depending on the production domain for its own asset.
- Keep contact, policy, service, and management links easy to scan and keyboard accessible.
- External social and regulator links need clear accessible names and safe new-tab attributes.
- Display only verified licences, review counts, client metrics, coverage totals, and regulatory claims.
- Encoding artifacts, broken symbols, and decorative emoji are not acceptable production content.

## Public Conversion

- The canonical primary CTA label is `Get Free Quote` or `Get Your Free Quote`, linked to `/quote`.
- Explain what happens next and avoid pressure-based or misleading language.
- Forms use visible labels, appropriate input types/autocomplete, useful errors near the field, loading feedback, and a clear success state.
- Never put health disclosures or other sensitive personal information into a URL.
- General educational content must not imply a binding quote, underwriting decision, or individualized legal, tax, medical, or insurance advice.

## Management Experience

- Preserve direct routes and browser history for every management section.
- Logout returns to `/management/login`; the login screen provides an explicit `Estate Nest Home` escape route.
- Use clear page titles, stable navigation, helpful empty states, retryable errors, and confirmation for destructive actions.
- Tables and charts must not communicate status by colour alone. Use text, icons, or labels and accessible descriptions.
- On narrow screens, prioritize essential actions without hiding required compliance context.

## Interaction and Motion

- Use 150-300ms transitions for hover, focus, menu, and state feedback.
- Animate transform and opacity instead of layout properties.
- Hover effects supplement click/tap feedback; they never contain required information.
- Respect `prefers-reduced-motion` and avoid scroll hijacking, forced pinning, parallax, or auto-playing motion that delays conversion.
- New motion libraries require separate approval and a measurable benefit.

## Accessibility Baseline

- Target WCAG 2.2 AA for colour contrast, keyboard access, focus visibility, labels, names, and status communication.
- Primary mobile controls use at least 44-by-44-pixel targets with adequate spacing.
- Icon-only buttons have accessible names; decorative icons use `aria-hidden="true"`.
- Do not remove focus outlines without an equal or stronger replacement.
- Verify 200% zoom, keyboard-only operation, reduced motion, and no horizontal scrolling.

## Change Review Checklist

1. Record the recommendation and why it improves usability or accessibility.
2. Confirm the change preserves the brand tokens and verified business behavior.
3. Test `/quote`, header/footer navigation, management routing, and browser back behavior where affected.
4. Run desktop and mobile Playwright coverage.
5. Check copy for regulated claims and quantified statements requiring verification.
6. Review a Vercel preview before production deployment.
