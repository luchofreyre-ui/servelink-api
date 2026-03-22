# Admin UI Design System Rules

## Design principles

The Admin UI should optimize for:
- clarity
- scanability
- trust
- fast decision-making
- low visual noise

It should not optimize for:
- novelty
- decoration
- consumer-style polish at the expense of density

---

## Layout rules

- Use a persistent sidebar for primary navigation.
- Use a consistent page header area with:
  - title
  - subtitle or context line
  - primary actions on the right
- Use cards sparingly. Dense tables and structured panels are preferred for operational screens.
- Use generous whitespace between sections, but compact data rows.

---

## Spacing scale

Use a consistent spacing system:
- 4
- 8
- 12
- 16
- 24
- 32

Prefer 16/24 for panel padding.

---

## Typography

### Page title
- large
- strong weight

### Section title
- medium-large
- semibold

### Body
- normal
- high readability

### Metadata
- slightly smaller
- lower visual emphasis

Do not use too many font sizes on one screen.

---

## Color usage

Use color semantically, not decoratively.

### Status colors
- urgent / destructive: red
- warning / high attention: amber
- success / completed / healthy: green
- info / neutral operational state: blue
- muted / secondary / archived: gray

### Rule
Never rely on color alone. Pair with label text or icon.

---

## Badges

Use badges for:
- priority
- status
- exception type
- activity type
- permission/availability state

Badge text should be short and machine-consistent.

Examples:
- urgent
- high
- normal
- active
- draft
- archived

---

## Tables

Operational lists should default to table or dense list layout.

### Required table behaviors
- sticky headers when useful
- sortable columns where supported
- row click opens detail
- empty state row when no items exist
- pagination footer or load-more pattern

### Column rule
Every table should have one clear primary identity column.

---

## Cards and panels

Use cards/panels for:
- summaries
- config compare sections
- preview warnings/highlights
- booking summary blocks

Avoid wrapping every piece of content in cards.

---

## Buttons

### Priority hierarchy
1. primary
2. secondary
3. tertiary / ghost
4. destructive

### Rule
Only one primary action per major panel.

Examples:
- Publish
- Save draft
- Manual assign confirm

---

## Modals and drawers

Use modals for:
- confirmations
- destructive actions
- short forms

Use drawers for:
- secondary detail
- history detail
- config audit inspection

Do not nest modals.

---

## Icons

Use icons as supporting scan helpers only.
Do not let icons replace text labels.

---

## Content tone

Text should be:
- direct
- operational
- precise

Avoid marketing tone.

Good:
- "No dispatch decision history is available for this booking."
- "Publishing this draft will update live dispatch behavior across 4 fields."

Bad:
- "Great news! Your configuration is looking awesome."

---

## Screen-specific emphasis

### Dashboard
- highest signal first
- urgent items top-left

### Exceptions
- sortable dense grid
- priority visually obvious

### Booking detail
- timeline and explainer must be easy to scan

### Config control
- warnings/highlights must be visually separated from raw field values

### Activity
- timestamp and action type must be scannable at a glance
