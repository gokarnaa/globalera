# Compact Sidebar Width and Navigation Item Density

Written against: `a886711`

## Evidence chain

- Surface: `src/components/layout/Sidebar.jsx`
- Problem: `Sidebar.jsx` uses `width: 280`, section `pt: 2.2`, item `py: 1`, `minWidth: 36` icon gutter, `0.84rem` labels, and `p: 2` footer padding, which clashes with the compact `0.78rem`–`0.81rem` density applied in `src/theme.js` and across all 32 Admin views.
- Design evidence: `media_1794835073484_6f263a9a.jpg`, `src/theme.js:53-105,224-295`, and `src/components/layout/Sidebar.jsx:155-420`
- Owner: `src/components/layout/Sidebar.jsx`
- Scope and affected surfaces: `src/components/layout/Sidebar.jsx`
- Uncertainty: none

## Design decision

Compact `Sidebar.jsx` width from `280` to `248` and tighten section headers (`pt: 1.4, pb: 0.4, fontSize: '0.64rem'`), nav item buttons (`py: 0.65, px: 1.2, mb: 0.2, borderRadius: 2`), icon gutters (`minWidth: 28`, icon `1.1rem`), labels (`fontSize: '0.78rem'`), and the footer status card (`p: 1.25` / `p: 1`).

## Reuse

- Compact typography and chip scale in `src/theme.js`
- Exemplar: `src/theme.js:77-95,287-295`

## Changes

1. `src/components/layout/Sidebar.jsx`
   - Change: Update drawer width from `280` to `248` (lines 155, 373, 394, 409, 413), tighten list item spacing (`py: 0.65, px: 1.2, mb: 0.2`), icon `minWidth: 28` (`1.1rem`), primary label `fontSize: '0.78rem'`, section header `pt: 1.4, pb: 0.4, fontSize: '0.64rem'`, and footer padding (`p: 1.25` outer, `p: 1` inner).
   - Preserve: Active indicator bar, badges (`countBadge`, `badge`), role filtering, and mobile temporary drawer behavior.
   - Verify: More navigation items fit vertically without scrolling, labels have cleaner proportion, and main content gains 32px of extra horizontal width on desktop.

## Scope

- Inherit: Desktop and mobile Sidebar navigation
- Verify: Selected state, hover state, badges, and footer status card
- Exclude: Top `Navbar.jsx` and `MobileNav.jsx`

## Validation

- Product: Navigate across Admin sections using the Sidebar on desktop and mobile.
- Interface: Confirm `248px` width and crisp `0.78rem` labels with zero overlap.
- System: Matches `src/theme.js` compact density.
- Repository: `npm run build` → exits with code `0`.

## Stop conditions

- Stop if any nav label + badge clips unreadably at `248px`.

## Design documentation

- After acceptance and validation: none
