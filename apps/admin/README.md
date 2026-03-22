# Servelink Admin

Operational admin UI for **admin.nustandardcleaning.com**.

## Stack

- Vite + React 18 + TypeScript
- React Router 6
- TanStack Query
- Tailwind CSS

## Routes (root-relative on admin host)

- `/` — Dashboard
- `/exceptions` — Dispatch Exceptions
- `/bookings/:bookingId` — Booking Dispatch Detail
- `/dispatch-config` — Dispatch Config
- `/activity` — Activity feed
- `/anomalies` — Anomalies
- `/supply` — Supply Intelligence (placeholder)
- `/supply/fo/:foId` — FO Supply Detail (placeholder)
- `/supply/shipments` — Shipment Planner (placeholder)
- `/supply/rules` — Supply Rules (placeholder)
- `/supply/activity` — Supply Activity (placeholder)
- `/settings` — Settings

## Development

```bash
npm install
npm run dev
```

Runs at http://localhost:3001. Proxy `/api` to your backend (e.g. `http://localhost:3000`).

## Build

```bash
npm run build
```

Output in `dist/`. Deploy to admin.nustandardcleaning.com.

## Wireframe docs

See `~/Desktop/servelink/services/api/docs/admin-ui/` and `docs/admin-ui/wireframes/` for API inventory, route map, and page-level specs.
