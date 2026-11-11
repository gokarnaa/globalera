# Align Course Card Inquiry Call-to-Action

Written against: 02c68bf

## Evidence chain

- Surface: `src/components/portal/PublicWebsite.jsx` (Lines 816–830)
- Problem: The main conversion call-to-action on the Hero Banner (L526) and Online Application form (L947) is Emerald Green (`#059669`), but the Course Card "Inquire About This Course" button (L821) is dark navy (`#0B2545`) with a sudden color-flip to `#059669` only on mouse hover.
- Design evidence: `src/theme.js` defines `palette.success.main` as `#059669` and `palette.success.dark` as `#047857`; `PublicWebsite.jsx` uses `#059669` for inquiry submission and "Apply Now" buttons.
- Owner: `src/components/portal/PublicWebsite.jsx`
- Scope and affected surfaces: Course catalog cards in `src/components/portal/PublicWebsite.jsx` (L816–830).
- Uncertainty: none.

## Design decision

Align the Course Card inquiry button styling directly with the primary conversion token (`#059669` emerald green) so that every course-inquiry action shares predictable visual affordance:
- `bgcolor: '#059669'`
- `hover: '#047857'`
- `color: '#FFFFFF'`
- `fontWeight: 800`
- `boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)'`

This establishes a clear, consistent conversion language across the website where green always signals enrollment/inquiry action.

## Reuse

- Tokens: `theme.palette.success.main` (`#059669`), `theme.palette.success.dark` (`#047857`)
- Exemplar: Hero "Apply Now" button at L526 and Inquiry submit button at L947.

## Changes

1. `src/components/portal/PublicWebsite.jsx`
   - Change: Update Course Card Action Button `sx` (L821–826) from dark navy to emerald green (`bgcolor: '#059669'`, hover `'#047857'`).
   - Preserve: `handleSelectCourseForInquiry(crs.id)` smooth scrolling behavior.
   - Verify: Course card buttons render in prominent emerald green, matching the "Apply Now" hero button and "Submit Inquiry" form button.

## Scope

- Inherit: Course Card mapping loop in `PublicWebsite.jsx`.
- Verify: Contrast ratio of `#FFFFFF` text on `#059669` background (exceeds 4.5:1 WCAG AA).
- Exclude: Secondary "Verify Certificate" action (which remains navy).

## Validation

- Product: Prospective trainees immediately recognize "Inquire About This Course" as the primary actionable path on every course card.
- Interface: Verify button appearance across all available course cards.
- System: Cohesive application of the conversion palette (`#059669`).
- Repository: `npm run build` → exit code 0.

## Stop conditions

- Stop if course card action styling clashes with the price badge directly above it.

## Design documentation

- After acceptance and validation: Record emerald green (`#059669`) as the universal enrollment/conversion CTA color for public-facing surfaces.
