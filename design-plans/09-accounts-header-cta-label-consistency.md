# Remove Redundant Plus Prefixes on AccountsManager Header Buttons

Written against: `722e01e`

## Evidence chain

- Surface: `src/components/accounts/AccountsManager.jsx` (Header Action Bar)
- Problem: `+ Collect Fee`, `+ Vendor Pay`, and `+ Disburse Pay` include `+ ` text prefixes alongside `startIcon`, unlike sibling buttons (`Bank Deposit`, `Cash Closing`, `Statements`, `Excel`) and `AdmissionManager.jsx`.
- Design evidence: `src/components/accounts/AccountsManager.jsx:942-1097` and `src/components/admission/AdmissionManager.jsx:366,388`
- Owner: `src/components/accounts/AccountsManager.jsx`
- Scope and affected surfaces: `src/components/accounts/AccountsManager.jsx`
- Uncertainty: none

## Design decision

Remove `+ ` from `Collect Fee`, `Vendor Pay`, and `Disburse Pay` button labels at lines 956, 981, and 1005.

## Reuse

- Header button labeling convention in `src/components/admission/AdmissionManager.jsx`

## Changes

1. `src/components/accounts/AccountsManager.jsx`
   - Change: Update `+ Collect Fee` → `Collect Fee`, `+ Vendor Pay` → `Vendor Pay`, and `+ Disburse Pay` → `Disburse Pay`.
   - Preserve: `startIcon`, button colors, and click handlers.
   - Verify: All 7 header buttons share a consistent icon + clean label pattern.

## Scope

- Inherit: `AccountsManager` header bar
- Verify: Button alignment and wrapping
- Exclude: Modal button labels

## Validation

- Product: Trigger `Collect Fee`, `Vendor Pay`, and `Disburse Pay` from the header bar.
- Interface: Consistent icon + label styling across all header buttons.
- System: Matches `AdmissionManager.jsx` header action convention.
- Repository: `npm run build` → exits with code `0`.

## Stop conditions

- Stop if any button lacks a `startIcon`.

## Design documentation

- After acceptance and validation: none
