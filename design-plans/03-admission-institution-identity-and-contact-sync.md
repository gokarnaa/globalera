# Synchronize Admission Surface and Printable Agreement with Canonical Institution Profile

Written against: `2b3e612`

## Evidence chain

- Surface: `src/components/admission/AdmissionManager.jsx` and `src/components/admission/AdmissionAgreementPrintModal.jsx`
- Problem: The admission header banner, WhatsApp fee receipt message, and printable dual-copy A4 agreement hardcode outdated institution names (`Global Era Technical School Jorpati`, `Technical School Jorpati`) and placeholder phone numbers (`01-410715`, `01-4915555, 9851000000`) that contradict the canonical profile in `src/services/storage.js`.
- Design evidence: `src/services/storage.js:289-306`, `src/components/layout/Navbar.jsx:213,228`, `src/components/admission/AdmissionManager.jsx:209,219,345`, and `src/components/admission/AdmissionAgreementPrintModal.jsx:68,71,151`
- Owner: `src/services/storage.js` (`settings.companyProfile`)
- Scope and affected surfaces: `src/components/admission/AdmissionManager.jsx`, `src/components/admission/AdmissionAgreementPrintModal.jsx`
- Uncertainty: none

## Design decision

Replace the stale hardcoded institution name and phone strings in `AdmissionManager.jsx` and `AdmissionAgreementPrintModal.jsx` with the canonical identity (`Prabidhik School, Jorpati` / `Global Era Multi Service Pvt. Ltd.`) and contact numbers (`01-4910715` / WhatsApp `9705147147`) defined in `src/services/storage.js`.

## Reuse

- Canonical profile values in `src/services/storage.js:289-306` and `src/components/layout/Navbar.jsx:213,228`
- Exemplar: `src/services/whatsappCloudApi.js:191-251`

## Changes

1. `src/components/admission/AdmissionManager.jsx`
   - Change: Update lines 209, 219-220 (WhatsApp receipt text) and line 345 (Hero Header Banner subtitle) from `Global Era Technical School` / `01-410715` to `Prabidhik School, Jorpati (Global Era Multi Service Pvt. Ltd.)` and `Phone: 01-4910715 | WhatsApp: 9705147147`.
   - Preserve: All receipt variables, WhatsApp dispatch logic, and agreement terms description.
   - Verify: Header banner and WhatsApp receipt display `Prabidhik School, Jorpati (Global Era Multi Service Pvt. Ltd.)` and `01-4910715` / `9705147147`.
2. `src/components/admission/AdmissionAgreementPrintModal.jsx`
   - Change: Update lines 68, 71, and 151 from `Technical School Jorpati` and `Phone: 01-4915555, 9851000000` to `Prabidhik School, Jorpati` and `Phone: 01-4910715 | WhatsApp: 9705147147`.
   - Preserve: Dual-copy (`OFFICE COPY` and `STUDENT COPY`) A4 print layout, typography, and legal clauses.
   - Verify: Both copies of the printable A4 agreement display the canonical institution name and contact numbers.

## Scope

- Inherit: `AdmissionManager` header, WhatsApp receipt generator, and `AdmissionAgreementPrintModal` (both Office and Student copies)
- Verify: A4 print preview modal and WhatsApp receipt payload
- Exclude: Unrelated modules outside `src/components/admission/`

## Validation

- Product: Open Admissions & Agreement, inspect the header banner, open an A4 Agreement print preview, and trigger WhatsApp receipt generation.
- Interface: Confirm no occurrences of `01-410715`, `01-4915555`, or `9851000000` remain in `src/components/admission/`.
- System: Matches `src/services/storage.js` canonical `companyProfile`.
- Repository: `npm run build` → exits with code `0`.

## Stop conditions

- Stop if `settings.companyProfile` schema changes.

## Design documentation

- After acceptance and validation: none
