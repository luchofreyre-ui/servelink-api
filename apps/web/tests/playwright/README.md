# Servelink Playwright admin regression

## Purpose

This suite validates the live admin operating surfaces in-browser against a deterministic local scenario.

## Required local stack

- Web app running on `http://localhost:3000`
- API running on `http://localhost:3001`
- Dev endpoint enabled: `/api/v1/dev/playwright/admin-scenario`

## Run

From repo root:

```bash
./tools/dev/start-servelink.sh
./tools/validation/run-playwright-smoke.sh
```

## Optional env overrides

- `PLAYWRIGHT_BASE_URL`
- `PLAYWRIGHT_API_BASE_URL`
- `PLAYWRIGHT_ADMIN_EMAIL`
- `PLAYWRIGHT_ADMIN_PASSWORD`
- `TARGET_FO_ID`

## Covered pages

- `/admin`
- `/admin/bookings/:bookingId`
- `/admin/exceptions`
- `/admin/exceptions/:exceptionId`
- `/admin/dispatch-config`
- `/admin/anomalies`
- `/admin/activity`

## Design rules

- Use seeded deterministic scenario data where possible
- Use shared fixtures/helpers
- Keep tests worker-safe and deterministic
- Prefer scenario ids over ad hoc record lookup
