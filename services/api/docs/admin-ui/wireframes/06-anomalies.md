# Anomalies

## Route
- `/admin/anomalies`

## Purpose
System anomaly review and action queue.

## Permissions
- anomalies.read
- anomalies.write for actions

## Primary APIs
- `GET /api/v1/admin/ops/anomalies`
- `GET /api/v1/admin/ops/anomalies/counts`
- anomaly action endpoints already implemented
- audit endpoints already implemented

## Page layout

```text
Header
- Title: Anomalies
- Subtitle: Operational anomaly management

Summary row
- due soon
- overdue
- breached
- mine
- unassigned

Filter row
- status
- severity
- mine
- unassigned
- SLA
- fingerprint / booking

Main table
- severity
- fingerprint
- status
- assignee
- SLA due
- last seen
- action buttons
```

## Actions
- assign
- unassign
- acknowledge
- resolve
- open audit history

## Empty state
- no anomalies match current filters

## Loading
- summary + table skeletons

## Error
- inline retry

## Drill-down
- audit/history panel or dedicated route if needed
