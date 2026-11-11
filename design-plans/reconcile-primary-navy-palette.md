# Reconcile Primary Navy Palette Drift

Written against: 02c68bf

## Evidence chain

- Surface: `src/components/portal/PublicWebsite.jsx` (Lines 258, 365, 486, 605, 744, 966)
- Problem: Four disparate hardcoded dark blues (`#081B33` at L258, `#0B2545` at L365/605/821, `#0F2E5A` at L486/744, and `#07182C` at L608/966) fragment the visual identity of the public portal.
- Design evidence: `src/theme.js` binds `palette.primary.main` to `#0F2C59` and `palette.primary.dark` to `#071A36`.
- Owner: `src/theme.js`
- Scope and affected surfaces: `src/components/portal/PublicWebsite.jsx` containers (Top bar, Sticky Header, Hero Banner, Certificate search, Course cards, Footer).
- Uncertainty: none.

## Design decision

Reconcile all hardcoded navy hex values in `PublicWebsite.jsx` to the canonical tokens from `src/theme.js`:
- Use `theme.palette.primary.main` (`#0F2C59`) for sticky header, hero linear-gradient center, course card headers, and primary search buttons.
- Use `theme.palette.primary.dark` (`#071A36`) for the top announcement bar, dark hero linear-gradient stops, and the site footer.

This establishes an exact 1:1 match with the design system tokens and unifies the public brand aesthetic.

## Reuse

- Tokens: `theme.palette.primary.main` (`#0F2C59`), `theme.palette.primary.dark` (`#071A36`)
- Exemplar: `src/theme.js` (lines 7–11)

## Changes

1. `src/components/portal/PublicWebsite.jsx`
   - Change:
     - Line 258 (Top Bar): Replace `bgcolor: '#081B33'` with `bgcolor: '#071A36'`.
     - Line 365 (Sticky Header): Replace `bgcolor: '#0B2545'` with `bgcolor: '#0F2C59'`.
     - Line 486 (Hero Banner): Replace `background: 'linear-gradient(135deg, #0B2545 0%, #0F2E5A 50%, #1E3A8A 100%)'` with `background: 'linear-gradient(135deg, #071A36 0%, #0F2C59 50%, #1E3A8A 100%)'`.
     - Line 605 & 608 (Verify Button): Replace `bgcolor: '#0B2545'` / hover `'#07182C'` with `bgcolor: '#0F2C59'` / hover `'#071A36'`.
     - Line 744 (Course Card Header): Replace `bgcolor: '#0F2E5A'` with `bgcolor: '#0F2C59'`.
     - Line 966 (Footer): Replace `bgcolor: '#07182C'` with `bgcolor: '#071A36'`.
   - Preserve: All spacing, typography, child components, and borders (`#F59E0B` amber accents).
   - Verify: Inspect colors across the page; all dark sections resolve to either `#0F2C59` or `#071A36`.

## Scope

- Inherit: `src/components/portal/PublicWebsite.jsx`.
- Verify: Contrast ratio between `#071A36` background and `#E2E8F0` / `#FFFFFF` text (exceeds WCAG AAA 7:1).
- Exclude: Admin dashboard internal layout (already uses `#0F2E5A` / `#0F2C59` system theme).

## Validation

- Product: Public portal exhibits a unified corporate aesthetic matching official Global Era brand materials.
- Interface: Verify page transitions between top bar, navigation header, hero, course cards, and footer.
- System: Zero undeclared ad-hoc dark navy hex codes remain in `PublicWebsite.jsx`.
- Repository: `npm run build` → exit code 0.

## Stop conditions

- Stop if changing background colors impairs text readability or icon visibility.

## Design documentation

- After acceptance and validation: None required; this change enforces already documented decisions in `src/theme.js`.
