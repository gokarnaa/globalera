# Eliminate Redundant Outer Padding in App Shell Main Wrapper

Written against: `a886711`

## Evidence chain

- Surface: `src/App.jsx` (`<main>` content wrapper around all 32 Admin Panel views)
- Problem: `src/App.jsx:653` applies `p: { xs: 1, sm: 2.5, md: 3 }` and line 660 applies `px: { xs: 0, sm: 1 }` on top of every child view's own `p: { xs: 1.5, sm: 2.2 }`, creating ~50px of double horizontal inset and ~42px of top padding before each module header.
- Design evidence: `src/App.jsx:648-666` and `src/components/admission/AdmissionManager.jsx:315`
- Owner: `src/App.jsx`
- Scope and affected surfaces: `src/App.jsx` and all 32 rendered Admin modules
- Uncertainty: none

## Design decision

Remove the redundant top and horizontal padding from `<main>` and its inner wrapper in `src/App.jsx` (`pt: 0, px: 0`), preserving only the mobile bottom safe-area clearance (`pb: { xs: 'calc(84px + env(safe-area-inset-bottom))', md: 3 }`) so each module's own `p: { xs: 1.5, sm: 2.2 }` serves as the single outer inset.

## Reuse

- Module-owned container padding `p: { xs: 1.5, sm: 2.2 }`
- Exemplar: `src/components/admission/AdmissionManager.jsx:315`

## Changes

1. `src/App.jsx`
   - Change: Replace `p: { xs: 1, sm: 2.5, md: 3 }` at line 653 with `pt: 0, px: 0` (keeping `pb: { xs: 'calc(84px + env(safe-area-inset-bottom))', md: 3 }`), and remove `px: { xs: 0, sm: 1 }` at line 660.
   - Preserve: `maxWidth: '1520px'`, `mx: 'auto'`, `ErrorBoundary`, and mobile bottom navigation clearance.
   - Verify: Admin views sit cleanly with a single uniform `p: { xs: 1.5, sm: 2.2 }` inset around the header bar and tables.

## Scope

- Inherit: All 32 Admin Panel tabs rendered by `renderContent()`
- Verify: Desktop (`md+`) and mobile (`xs`) viewports
- Exclude: Standalone portals (`EmployerPortal`, `TrainerPortal`, `StudentPortal`, `AgentPortal`, `PublicWebsite`)

## Validation

- Product: Switch between Dashboard, Admissions, Leads, and Accounts tabs.
- Interface: Confirm single uniform outer margin around header bars and tables.
- System: Eliminates parallel outer-padding layers.
- Repository: `npm run build` → exits with code `0`.

## Stop conditions

- Stop if any child tab lacks its own outer padding.

## Design documentation

- After acceptance and validation: none
