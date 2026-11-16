# Make AccountsManager Master Tabs Scrollable on Narrow Viewports

Written against: `722e01e`

## Evidence chain

- Surface: `src/components/accounts/AccountsManager.jsx` (Navigation Master Tabs)
- Problem: `<Tabs variant="standard">` with `flex: 1` forces 5 long tab labels into 100% width without scrolling, cramping labels below `md`.
- Design evidence: `src/components/accounts/AccountsManager.jsx:1149-1185`
- Owner: `src/components/accounts/AccountsManager.jsx`
- Scope and affected surfaces: `src/components/accounts/AccountsManager.jsx`
- Uncertainty: none

## Design decision

Switch `<Tabs>` to `variant="scrollable"` with `scrollButtons="auto"` and `allowScrollButtonsMobile`, and use `whiteSpace: 'nowrap'` with `flex: { md: 1 }` on `.MuiTab-root`.

## Reuse

- MUI `Tabs` scrollable variant
- Exemplar: `src/components/accounts/AccountsManager.jsx:1149-1185`

## Changes

1. `src/components/accounts/AccountsManager.jsx`
   - Change: Update `<Tabs>` at lines 1149-1178 to `variant="scrollable"`, `scrollButtons="auto"`, `allowScrollButtonsMobile`, and `.MuiTab-root` to `flex: { md: 1 }, whiteSpace: 'nowrap'`.
   - Preserve: Tab labels, icons, active indicator, and `activeTab` state.
   - Verify: All 5 tabs display on a single row and scroll smoothly on mobile/tablet.

## Scope

- Inherit: `AccountsManager` master tab bar
- Verify: `xs`, `sm`, and `md+` viewports
- Exclude: Sub-tabs inside child views

## Validation

- Product: Switch across all 5 Accounts tabs on desktop and mobile.
- Interface: Single-row tab labels with zero text cramping.
- System: Standard MUI `Tabs` scrollable behavior.
- Repository: `npm run build` → exits with code `0`.

## Stop conditions

- Stop if tab indicator misalignment occurs.

## Design documentation

- After acceptance and validation: none
