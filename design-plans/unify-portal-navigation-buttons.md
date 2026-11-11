# Unify Header Portal Navigation Actions

Written against: 02c68bf

## Evidence chain

- Surface: `src/components/portal/PublicWebsite.jsx` (Lines 395–467)
- Problem: Three peer portal buttons (Agent, Trainer, Student) sharing the same navigation row and functional purpose use three discordant visual styles: Agent is Amber outlined (`#F59E0B`), Trainer is Emerald outlined (`#10B981`), and Student is Sky Blue solid filled (`#0284C7`).
- Design evidence: `src/theme.js` button configuration (`typography.button` weight 700, `textTransform: 'none'`); dark navy header background (`#0B2545`).
- Owner: `src/components/portal/PublicWebsite.jsx`
- Scope and affected surfaces: Sticky header navigation bar in `src/components/portal/PublicWebsite.jsx`.
- Uncertainty: none.

## Design decision

Standardize all three portal navigation buttons into a unified, subtle glassmorphic action group. Each button will share:
- `variant="outlined"`
- Uniform border: `1px solid rgba(255, 255, 255, 0.22)`
- Color: `#FFFFFF`
- Typography: `fontSize: '0.76rem'`, `fontWeight: 700`
- Border radius: `6px`
- Background hover: `rgba(255, 255, 255, 0.12)`
- Preserved role icons: `HandshakeIcon` (Agent), `PeopleAltIcon` (Trainer), `SchoolIcon` (Student).

This eliminates conflicting visual prominence and presents a coherent, institutional header.

## Reuse

- Component: MUI `Button` with `size="small"`
- Exemplar: Top header navigation stack in `src/components/portal/PublicWebsite.jsx`

## Changes

1. `src/components/portal/PublicWebsite.jsx`
   - Change: Replace custom heterogeneous sx styles on Agent Portal, Trainer Portal, and Student Portal buttons (lines 418–464) with the unified glassmorphic action token.
   - Preserve: Navigation click handlers (`onNavigate('agent')`, `onNavigate('trainer')`, `onNavigate('student')`) and icons.
   - Verify: Sibling portal buttons render with identical visual density, height, border geometry, and hover feedback.

## Scope

- Inherit: Header navigation stack in `PublicWebsite.jsx`.
- Verify: Mobile responsive breakpoint (`display: { xs: ..., sm: ... }`).
- Exclude: Footer portal navigation links (which use simple vertical text links).

## Validation

- Product: Trainees, trainers, and agents easily locate their respective portals without visual distraction.
- Interface: Verify sticky header at 1440px desktop, 1024px tablet, and 375px mobile viewports.
- System: Confirm no newly introduced color tokens outside `src/theme.js`.
- Repository: `npm run build` → exit code 0.

## Stop conditions

- Stop if changing button styles alters navigation callback routing.

## Design documentation

- After acceptance and validation: Record the header glassmorphic button pattern under `src/theme.js` or component style guide.
