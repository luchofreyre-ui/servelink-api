# Dashboard

## Route
- `/admin`

## Purpose
High-signal operational overview for admins and owners.

## Permissions
- admin auth
- typically requires: dispatch.read, anomalies.read, audit.read, supply.read

## Primary APIs
- `GET /api/v1/admin/activity`
- `GET /api/v1/admin/dispatch/exceptions`
- `GET /api/v1/admin/ops/anomalies`
- `GET /api/v1/admin/ops/anomalies/counts`

## Page layout

```text
Header
- Title: Dashboard
- Subtitle: Operational overview
- Actions: Refresh

Row 1
- Urgent Dispatch Exceptions
- Anomaly Summary

Row 2
- Recent Activity
- Supply Risk Summary

Row 3
- Quick Links / Shortcuts
```

## Sections

### A. Urgent Dispatch Exceptions
- top urgent items only
- columns: priority, booking, type, scheduled start, recommended action
- action: View all exceptions

### B. Anomaly Summary
- due soon
- overdue
- breached
- unassigned
- mine
- action: open anomalies

### C. Recent Activity
- latest 10–15 activity items
- action: open full activity page

### D. Supply Risk Summary
- top FO runway risks
- shipments due soon
- action: open supply overview

### E. Quick Links
- Dispatch Config
- Exceptions
- Activity
- Supply Rules
- Anomalies

## Empty states
- no urgent exceptions
- no recent activity
- no anomalies needing action

## Loading
- card skeletons for each panel

## Error
- per-panel inline error with retry

## Drill-downs
- exception row → booking detail
- activity item → related source
- anomaly card → anomalies page
