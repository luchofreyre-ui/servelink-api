# Activity

## Route
- `/admin/activity`

## Purpose
Recent admin operational action feed.

## Permissions
- audit.read

## Primary API
- `GET /api/v1/admin/activity`

## Page layout

```text
Header
- Title: Activity
- Subtitle: Recent admin actions

Filter row
- Type
- Actor
- Related booking/config if added later

Feed list
- timestamp
- type badge
- title
- description
- related links
```

## Activity item content
- type
- actor
- createdAt
- title
- description
- booking/config references where present

## Empty state
- "No activity found."

## Loading
- feed skeleton rows

## Error
- page retry state

## Drill-down
- booking-linked activity → booking detail
- config publish activity → dispatch config history/detail
