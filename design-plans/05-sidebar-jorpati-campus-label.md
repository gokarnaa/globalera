# Align Sidebar Footer Campus Label with Canonical Jorpati Profile

Written against: `a886711`

## Evidence chain

- Surface: `src/components/layout/Sidebar.jsx` (Footer System Status Card)
- Problem: Line 362 renders `Active Batches: {N} Groups • MitraPark Hub`, contradicting the canonical `Jorpati, Kathmandu` campus location in `Navbar.jsx` and `storage.js`.
- Design evidence: `media_1794835073484_6f263a9a.jpg`, `src/components/layout/Navbar.jsx:228`, `src/services/storage.js:291,302`, and `src/components/layout/Sidebar.jsx:362`
- Owner: `src/services/storage.js`
- Scope and affected surfaces: `src/components/layout/Sidebar.jsx`
- Uncertainty: none

## Design decision

Replace `• MitraPark Hub` with `• Jorpati Campus` at `src/components/layout/Sidebar.jsx:362`.

## Reuse

- Canonical campus location in `src/services/storage.js:291,302`
- Exemplar: `src/components/layout/Navbar.jsx:228`

## Changes

1. `src/components/layout/Sidebar.jsx`
   - Change: Replace `Active Batches: <b>{(db.trainingGroups || []).length} Groups</b> • MitraPark Hub` at line 362 with `Active Batches: <b>{(db.trainingGroups || []).length} Groups</b> • Jorpati Campus`.
   - Preserve: Dynamic `(db.trainingGroups || []).length` count and status card click handler.
   - Verify: Sidebar footer displays `• Jorpati Campus`.

## Scope

- Inherit: Desktop persistent sidebar and mobile navigation drawer
- Verify: Sidebar footer card
- Exclude: Other navigation items

## Validation

- Product: Inspect the bottom-left Sidebar status card in Admin Panel.
- Interface: Confirm `Jorpati Campus` renders on a single line.
- System: Matches `Navbar.jsx` and `storage.js`.
- Repository: `npm run build` → exits with code `0`.

## Stop conditions

- Stop if footer card overflows horizontally.

## Design documentation

- After acceptance and validation: none
