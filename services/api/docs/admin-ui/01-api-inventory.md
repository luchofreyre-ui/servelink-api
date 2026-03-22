# Admin UI API Inventory

## Rule

This document is the frozen v1 API inventory for the Admin UI.
Frontend work should only depend on endpoints listed here unless this document is updated intentionally.

---

## 1. Dispatch Dashboard

### Primary use
Operational overview of current dispatch state.

### Endpoints
- `GET /api/v1/admin/activity`
- `GET /api/v1/admin/dispatch/exceptions`
- `GET /api/v1/admin/ops/anomalies`
- `GET /api/v1/admin/ops/anomalies/counts`

### Notes
The dashboard should prioritize:
- urgent dispatch exceptions
- recent admin actions
- anomalies needing review

---

## 2. Dispatch Exceptions List

### Primary use
List and triage dispatch problems.

### Endpoints
- `GET /api/v1/admin/dispatch/exceptions`

### Expected query support
- `limit`
- `cursor`
- `sortBy`
- `sortOrder`
- `type`
- `priority`
- `bookingStatus`
- `bookingId`
- `foId`

### Notes
This is the main operational triage screen.

---

## 3. Booking Dispatch Detail

### Primary use
Explain what happened for one booking and allow safe intervention.

### Endpoints
- `GET /api/v1/bookings/:bookingId`
- `GET /api/v1/bookings/:bookingId/dispatch-timeline`
- `GET /api/v1/bookings/:bookingId/dispatch-explainer`
- `GET /api/v1/bookings/:bookingId/dispatch-exception-detail`
- `POST /api/v1/bookings/:bookingId/dispatch-operator-notes`
- `POST /api/v1/admin/bookings/:id/dispatch/manual-assign`
- `POST /api/v1/admin/bookings/:id/dispatch/manual-redispatch`
- `POST /api/v1/admin/bookings/:id/dispatch/exclude-provider`

### Notes
This screen should unify:
- booking context
- dispatch history
- ranking explanation
- notes
- manual actions

Booking summary and dispatch/notes endpoints live under `/api/v1/bookings` with admin guards; manual ops live under `/api/v1/admin/bookings`.

---

## 4. Dispatch Config Control

### Primary use
View, edit, compare, preview, publish, inspect history, and restore draft from prior published configs.

### Endpoints
- `GET /api/v1/admin/dispatch-config/active`
- `GET /api/v1/admin/dispatch-config/draft`
- `POST /api/v1/admin/dispatch-config/draft`
- `GET /api/v1/admin/dispatch-config/compare`
- `GET /api/v1/admin/dispatch-config/publish-preview`
- `POST /api/v1/admin/dispatch-config/publish`
- `GET /api/v1/admin/dispatch-config/publish-history`
- `GET /api/v1/admin/dispatch-config/publish-history/latest`
- `GET /api/v1/admin/dispatch-config/publish-history/:auditId`
- `POST /api/v1/admin/dispatch-config/rollback-from-audit`

### Notes
This should behave like a controlled configuration workflow, not a raw settings form.

---

## 5. Admin Activity Feed

### Primary use
Review recent operational actions across the system.

### Endpoints
- `GET /api/v1/admin/activity`

### Notes
Activity sources currently include:
- dispatch config publish
- dispatch operator notes
- manual dispatch actions
- anomaly audit actions

---

## 6. Ops / Anomalies

### Primary use
Review and manage system anomalies.

### Endpoints
- `GET /api/v1/admin/ops/anomalies`
- `GET /api/v1/admin/ops/anomalies/counts`
- `GET /api/v1/admin/ops/anomalies/audit`
- `GET /api/v1/admin/ops/alerts/:fingerprint/audit`
- anomaly action endpoints already implemented in the backend (ack, resolve, assign, unassign, etc.)

### Notes
This can be linked from dashboard and activity feed in v1 even if it is not the first polished screen.

---

## API contract assumptions

### List endpoints
Admin list endpoints should return:

```json
{
  "items": [],
  "nextCursor": null
}
```

Optional: `totalCount`

### Dates
All dates are ISO-8601 strings.

### Empty states
Collections return empty arrays, not null.

### Permissions
Frontend should treat 403 as a capability failure and 401 as an auth/session failure.
