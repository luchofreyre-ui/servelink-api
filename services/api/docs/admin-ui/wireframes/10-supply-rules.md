# Supply Rules

## Route
- `/admin/supply/rules`

## Purpose
Owner-only micro-adjustment control panel for supply intelligence.

## Permissions
- supply.owner
- supply.rules.write
- supply.overrides.write
- supply.audit.read

## Primary APIs
To be implemented by supply backend when ready.

## Page layout

```text
Header
- Title: Supply Rules
- Subtitle: Global rules, territory overrides, FO overrides
- Actions: Save Changes

Main body with tabs
- Global Rules
- Territory Overrides
- FO Overrides
- Runway Rules
- Dispatch-Aware Weights
- History
```

## Sections

### Global Rules
- per-category usage assumptions
- service multipliers
- add-on multipliers

### Territory Overrides
- market/territory-specific multipliers

### FO Overrides
- FO-specific adjustments

### Runway Rules
- min runway
- refill target days
- emergency threshold

### Dispatch-Aware Weights
- future phase controls
- supply runway penalty weight
- shipment batch bonus weight
- territory cluster bonus weight

### History
- rule change audit

## UX rules
- show before/after values
- show affected scope
- require confirmation for save
- write audit row on change
