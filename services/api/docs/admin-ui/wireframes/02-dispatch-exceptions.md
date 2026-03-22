# Dispatch Exceptions

## Route
- `/admin/exceptions`

## Purpose
Primary operational triage queue for dispatch issues.

## Permissions
- exceptions.read

## Primary API
- `GET /api/v1/admin/dispatch/exceptions`

## Page layout

```text
Header
- Title: Dispatch Exceptions
- Subtitle: Triage and investigate dispatch issues

Filter Bar
- Search / Booking ID
- Priority
- Type
- Booking Status
- FO
- Sort By
- Sort Order

Main Table
- Priority
- Booking
- Type
- Status
- Scheduled Start
- FO
- Recommended Action
- Manual Intervention

Footer
- Pagination / Load more
```

## Table behavior
- row click opens booking detail
- sort supported
- dense operational table
- sticky header preferred

## Empty state
- "No exceptions match the current filters."

## Loading
- table skeleton rows

## Error
- page-level retry state

## Drill-down
- booking row → /admin/bookings/:bookingId
