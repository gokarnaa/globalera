# Restore Horizontal Scroll on AccountsManager Tables

Written against: `722e01e`

## Evidence chain

- Surface: `src/components/accounts/AccountsManager.jsx`
- Problem: `<TableContainer>` overrides the theme's `overflowX: 'auto'` with `overflow: 'hidden'`, clipping right-hand columns on narrow viewports.
- Design evidence: `src/theme.js:251-258` (`MuiTableContainer`) and `src/components/accounts/AccountsManager.jsx:1223`.
- Owner: `src/theme.js` (`MuiTableContainer`)
- Scope and affected surfaces: `src/components/accounts/AccountsManager.jsx`
- Uncertainty: none

## Design decision

Replace `overflow: 'hidden'` on `<TableContainer>` in `AccountsManager.jsx` with `overflowX: 'auto'` so tables remain horizontally scrollable while preserving rounded card borders.

## Reuse

- `src/theme.js:251-258` (`MuiTableContainer`)

## Changes

1. `src/components/accounts/AccountsManager.jsx`
   - Change: Replace `overflow: 'hidden'` with `overflowX: 'auto'` on `<TableContainer>`.
   - Preserve: `borderRadius: 2` and `border: '1px solid #E2E8F0'`.
   - Verify: Table columns scroll horizontally on narrow viewports without clipping.

## Scope

- Inherit: `AccountsManager` table containers
- Verify: `xs`, `sm`, and `md+` viewports
- Exclude: Non-table containers

## Validation

- Product: View `AccountsManager` tables on mobile/narrow viewports.
- Interface: Horizontal scroll works cleanly without clipping right columns.
- System: Conforms to `MuiTableContainer` in `src/theme.js`.
- Repository: `npm run build` → exits with code `0`.

## Stop conditions

- Stop if `TableContainer` parent clips overflow.

## Design documentation

- After acceptance and validation: none
