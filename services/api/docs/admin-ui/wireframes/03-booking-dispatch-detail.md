# Booking Dispatch Detail

## Route
- `/admin/bookings/:bookingId`

## Purpose
Full investigation and intervention surface for one booking.

## Permissions
- exceptions.read
- exceptions.write for notes
- dispatch.ops for manual actions

## Primary APIs
- `GET /api/v1/bookings/:bookingId`
- `GET /api/v1/bookings/:bookingId/dispatch-timeline`
- `GET /api/v1/bookings/:bookingId/dispatch-explainer`
- `GET /api/v1/bookings/:bookingId/dispatch-exception-detail`
- `POST /api/v1/bookings/:bookingId/dispatch-operator-notes`
- `POST /api/v1/admin/bookings/:id/dispatch/manual-assign`
- `POST /api/v1/admin/bookings/:id/dispatch/manual-redispatch`
- `POST /api/v1/admin/bookings/:id/dispatch/exclude-provider`

## Page layout

```text
Header
- Title: Booking Dispatch Detail
- Subtitle: booking id + status
- Actions: Manual Assign | Manual Redispatch | Exclude Provider

Row 1
- Booking Summary
- Exception Summary

Row 2
- Dispatch Timeline

Row 3
- Dispatch Explainer

Row 4
- Operator Notes
```

## Sections

### A. Booking Summary
- booking id
- status
- scheduled start
- assigned FO
- service basics

### B. Exception Summary
- priority bucket
- exception type
- recommended action
- manual intervention flag

### C. Dispatch Timeline
- decision history
- triggers
- candidate outcomes
- append-only chronology

### D. Dispatch Explainer
- summary
- selected candidate
- ranked candidates
- factor breakdown
- explanation lines

### E. Operator Notes
- note list
- add note form

## Actions

### Manual Assign
- opens modal/drawer
- select provider
- confirm
- refresh booking/timeline/explainer

### Manual Redispatch
- confirm modal
- refresh booking/timeline/explainer

### Exclude Provider
- select/confirm provider
- confirm action
- refresh booking/timeline/explainer

## Empty states
- no dispatch history
- no notes
- no exception detail

## Loading
- each section skeleton separately

## Error
- section-level errors when possible

## Notes UX
- textarea + save
- success clears or preserves depending UX preference
