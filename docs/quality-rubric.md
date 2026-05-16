# Quality Rubric

Designme scores generated artifacts with deterministic local rules. The report is not a replacement for human review, but it catches common issues before handoff.

## Categories

- Accessibility: named buttons, focus visibility, nav labels, segmented control state.
- Contrast: token-level text/background checks and manual warnings for mixed colors.
- Hierarchy: heading count, hero length, primary action count and metric competition.
- Layout: module depth, density risk and feature richness.
- Copy: generic phrases, weak action verbs and missing primary actions.
- Export: standalone doctype, viewport and UX metadata.

## Severity

- Error: fix before treating the export as usable.
- Warning: fix before visual polish or client review.
- Info: useful manual check or future improvement.

The score is derived from issues, not from a fixed aesthetic preference.
