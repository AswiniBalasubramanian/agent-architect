# Shadcn-style application theme

## Goal
Restyle the complete test-management application with a clean, professional shadcn visual language while preserving every existing page and workflow.

## Changes
- Replace the current frosted “flight deck” treatment with opaque neutral surfaces, subtle borders, restrained shadows, and consistent shadcn spacing and radii.
- Standardize the global palette around semantic background, card, muted, border, primary, destructive, and status tokens, including a polished dark theme.
- Rework the application shell into a shadcn-style collapsible icon sidebar with familiar Lucide icons, clear active states, a compact top bar, project selector, search, and user menu treatment.
- Update shared panels, buttons, fields, pills, dialogs, page headings, tables, meters, and empty states so every existing page inherits the same visual system.
- Replace text-symbol controls with accessible icons and tooltips where appropriate, while retaining existing behavior.
- Keep the dense, professional test-operations layout and all current data, actions, navigation, and page content unchanged.
- Fix the existing time-based hydration mismatch while touching the shared presentation layer.

## Verification
- Check every application page at desktop and mobile widths for overflow, overlap, navigation, dialogs, and readable tables.
- Confirm the application builds cleanly and has no new browser errors.

## Technical details
- Continue using Tailwind v4 semantic tokens in `src/styles.css` and the existing shared React UI layer.
- Use the already-installed Lucide and Radix packages; no backend or data-model changes.
