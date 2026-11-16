# Align Admission Header Banner to 12-Column Grid and Prevent CTA Button Wrapping

Written against: `2b3e612`

## Evidence chain

- Surface: `src/components/admission/AdmissionManager.jsx` (`admissions` admin view)
- Problem: The Hero Header Banner allocates `md={8}` to the title/description column and `md={5}` to the action-button column (`8 + 5 = 13 > 12`), forcing the right-aligned CTA column onto a second row at `md+` and wrapping both CTA button labels across two lines (`Admit From / Leads (78)` and `+ Direct Walk- / in Admission`).
- Design evidence: `media_1794835073484_6f263a9a.jpg` (rendered screenshot), `src/components/admission/AdmissionManager.jsx:336-392`, and `src/theme.js:213-235` (`MuiButton` contract).
- Owner: `src/components/admission/AdmissionManager.jsx`
- Scope and affected surfaces: `src/components/admission/AdmissionManager.jsx`
- Uncertainty: none

## Design decision

Change the header `<Grid item>` column split from `md={8}` / `md={5}` to `md={7}` / `md={5}` (`7 + 5 = 12`) and add `whiteSpace: 'nowrap'` to both header CTA buttons so the title and action buttons sit on a single balanced row on desktop without multi-line button label breaks.

## Reuse

- MUI `Grid` 12-column layout (`md={7}` + `md={5}`)
- Exemplar: `src/components/admission/AdmissionManager.jsx:336-392`

## Changes

1. `src/components/admission/AdmissionManager.jsx`
   - Change: Update line 337 from `<Grid item xs={12} md={8}>` to `<Grid item xs={12} md={7}>`, and add `whiteSpace: 'nowrap'` to both header `Button` `sx` blocks (lines 355 and 377).
   - Preserve: Existing button handlers (`setAdmitFromLeadOpen(true)`, `setNewAdmissionOpen(true)`), colors, icons, and responsive mobile stacking (`direction={{ xs: 'column', sm: 'row' }}`).
   - Verify: On `md+` viewports, both columns render on the same horizontal row and button labels stay on a single line.

## Scope

- Inherit: `AdmissionManager` header banner
- Verify: `AdmissionManager` at `xs`, `sm`, and `md+` breakpoints
- Exclude: KPI cards, filter bar, and admission modals

## Validation

- Product: Open Admissions & Agreement tab and trigger both header CTAs.
- Interface: Verify single-row header alignment and single-line button labels at `md` (`900px+`) and stacked mobile layout at `xs`.
- System: Uses standard 12-column MUI `Grid` allocation without custom layout primitives.
- Repository: `npm run build` → exits with code `0`.

## Stop conditions

- Stop if header button labels overflow at `md` (`900px`) when lead counts exceed 3 digits.

## Design documentation

- After acceptance and validation: none
