# Admin UI Shell

## Route scope
- `/admin/*`

## Purpose
Provide the shared application shell for all admin pages.

## Permissions
- authenticated admin required

## Layout

```text
┌──────────────────────────────────────────────────────────────┐
│ Top header: page title | subtitle | primary actions         │
├───────────────┬──────────────────────────────────────────────┤
│ Sidebar       │ Main content                                 │
│               │                                              │
│ Dashboard     │ Page body                                    │
│ Dispatch      │                                              │
│ Anomalies     │                                              │
│ Supply        │                                              │
│ Activity      │                                              │
│ Settings      │                                              │
└───────────────┴──────────────────────────────────────────────┘
```

## Sidebar nav

- Dashboard
- Dispatch
  - Exceptions
  - Config
- Anomalies
- Supply Intelligence
  - Overview
  - Shipments
  - Rules
  - Activity
- Activity
- Settings

## Shell rules

- persistent left sidebar
- page header always visible
- page-level actions appear in header
- filters belong inside page body, not global header
- detail pages can use right drawer selectively
- no modal-in-modal

## Global states

- session expired → redirect to login
- forbidden → no access page
- 5xx → page error state with retry
