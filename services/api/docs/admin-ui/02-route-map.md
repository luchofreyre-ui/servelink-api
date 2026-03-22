# Admin UI Route Map

See `docs/admin-ui/wireframes/` for page-level implementation structure.

## Top-level navigation

### 1. Dashboard
Route:
- `/admin`

Purpose:
- operational overview
- urgent work queue
- recent admin activity

Primary panels:
- urgent dispatch exceptions
- anomalies summary
- recent activity
- quick links to dispatch config and exceptions

---

### 2. Dispatch Exceptions
Route:
- `/admin/exceptions`

Purpose:
- triage and work queue for dispatch-related problems

Primary UI:
- filter bar
- sortable exceptions table
- priority badges
- recommended action indicators
- click-through to booking detail

---

### 3. Booking Dispatch Detail
Route:
- `/admin/bookings/:bookingId`

Purpose:
- full investigation and intervention surface for a booking

Sections:
- booking summary
- dispatch timeline
- dispatch explainer
- operator notes
- manual actions

Manual actions:
- manual assign
- manual redispatch
- exclude provider

---

### 4. Dispatch Config
Route:
- `/admin/dispatch-config`

Purpose:
- manage live dispatch behavior safely

Tabs or sections:
- active
- draft
- compare
- preview
- history

Sub-route optional:
- `/admin/dispatch-config/history/:auditId`

---

### 5. Activity
Route:
- `/admin/activity`

Purpose:
- audit-friendly recent admin action history

Primary UI:
- activity feed list
- source badges
- timestamps
- links to related booking/config context

---

### 6. Anomalies
Route:
- `/admin/anomalies`

Purpose:
- operational anomaly review

Primary UI:
- grouped anomaly list
- assignee / SLA state
- audit history links

---

## Navigation rules

- Dashboard is the default landing page after admin login.
- Booking detail should be reachable from exceptions, activity, and manual dispatch flows.
- Dispatch Config should be a top-level nav item.
- Activity should be top-level in v1.
- Deep modal nesting should be avoided; prefer page + drawer/modal, not modal-in-modal.

## Preferred UI shell

- persistent left sidebar
- top header with page title and action area
- content area with page-level filters
- right-side detail drawers only where helpful

## Preferred detail behavior

- Exceptions list opens booking detail on click
- Activity item links into its source context
- Config history can open in side panel or dedicated detail route
