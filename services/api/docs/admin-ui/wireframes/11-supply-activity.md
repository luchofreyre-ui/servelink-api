# Supply Activity

## Route
- `/admin/supply/activity`

## Purpose
Owner-facing audit trail for supply actions and rule changes.

## Permissions
- supply.audit.read
- owner visibility preferred

## Primary APIs
To be implemented by supply backend when ready.

## Page layout

```text
Header
- Title: Supply Activity
- Subtitle: Recent supply actions and rule changes

Filter row
- type
- actor
- scope
- FO
- territory

Feed/table
- createdAt
- type
- actor
- scope
- description
- related link
```

## Includes
- rule changes
- override changes
- shipment approvals
- shipment delays
- forced shipments
- supply anomaly actions
