# Public Header and Route Navigation Audit

## Owner-Reported Findings

- The fixed header becomes difficult to read where it sits over blue page heroes.
- Content from a previous page remains at the same scroll depth after client-side navigation, which makes the next page appear underneath the fixed header instead of at its beginning.
- Desktop and mobile navigation do not communicate the active page strongly enough.
- The Estate Nest brand link and inactive navigation hover states need clearer interaction feedback without replacing the established brand.

## Recommendation

1. Keep the fixed 80-pixel header but use an opaque cool-blue surface built from the existing `background` and `muted` tokens.
2. Preserve the approved blue, cyan, and coral palette. Use a restrained blue-to-cyan-to-coral tint and underline for active and hover states rather than introducing an unrelated green.
3. Keep navigation text dark on the light tint for WCAG contrast; do not place normal-size white text over the lighter cyan or coral stops.
4. Add `aria-current="page"` so the active state is available to assistive technology and is not communicated by colour alone.
5. Reset public-page scroll position to the top after each pathname change while leaving management routing behavior independent.
6. Keep all navigation targets at least 44 pixels high and preserve visible keyboard focus.

## Affected Pages

- `/services`
- `/about`
- `/faq`
- `/service-areas`
- `/contact`
- All other public routes that reuse the shared header or footer navigation

## Expected Impact

- **Accessibility:** stronger contrast, an explicit current-page state, predictable page starts, and unchanged keyboard/touch support.
- **Conversion:** visitors see the intended page heading immediately and retain an unobstructed route to the quote CTA.
- **Brand:** improves polish using only the existing Estate Nest palette and typography.

## Regression Risk and Gates

- Verify every affected page heading starts below the fixed header.
- Verify footer and header links reset the destination to the top.
- Verify desktop active states, mobile menu states, browser history, and `/quote` routing with Playwright.
- Verify 375, 1024, 1280, and 1440 pixel layouts have no horizontal overflow.
