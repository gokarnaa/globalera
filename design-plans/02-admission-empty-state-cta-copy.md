# Align Admission Empty-State Prompt with Rendered CTA Button Labels

Written against: `2b3e612`

## Evidence chain

- Surface: `src/components/admission/AdmissionManager.jsx` (Admissions table empty state)
- Problem: When `filteredAdmissions.length === 0`, the empty-state table cell instructs users to `Click '+ New Admission & Agreement' to register an enrollment.`, referencing a button label that does not exist on the surface.
- Design evidence: `src/components/admission/AdmissionManager.jsx:366,388,688`
- Owner: `src/components/admission/AdmissionManager.jsx`
- Scope and affected surfaces: `src/components/admission/AdmissionManager.jsx`
- Uncertainty: none

## Design decision

Update the empty-state copy at `src/components/admission/AdmissionManager.jsx:688` to name the actual CTA buttons rendered in the header (`'+ Direct Walk-in Admission'` and `'Admit From Leads'`).

## Reuse

- Existing header CTA labels in `src/components/admission/AdmissionManager.jsx:366,388`
- Exemplar: `src/components/admission/AdmissionManager.jsx:685-690`

## Changes

1. `src/components/admission/AdmissionManager.jsx`
   - Change: Replace `No admission agreements found. Click '+ New Admission & Agreement' to register an enrollment.` at line 688 with `No admission agreements found. Click '+ Direct Walk-in Admission' or 'Admit From Leads' to register an enrollment.`
   - Preserve: Table cell structure (`colSpan={8}`, padding, and `#64748b` text color).
   - Verify: When `filteredAdmissions.length === 0`, the empty state displays the exact CTA names present in the header.

## Scope

- Inherit: `AdmissionManager` empty table state
- Verify: `AdmissionManager` with zero admissions or unmatched filter query
- Exclude: Non-empty table rows and pagination

## Validation

- Product: View Admissions & Agreement when no agreements match the current filter.
- Interface: Confirm empty-state text matches the header button labels verbatim.
- System: No new tokens or components introduced.
- Repository: `npm run build` → exits with code `0`.

## Stop conditions

- Stop if header CTA button labels are renamed.

## Design documentation

- After acceptance and validation: none
