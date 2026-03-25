# Servelink Playwright validation framework

## Purpose

This suite validates Servelink end to end in-browser against deterministic scenario-backed data.

## Current scope

### Implemented

- Admin regression coverage
- Admin smoke coverage
- Shared auth/scenario helper foundation
- Validation framework structure for future booking / FO / customer expansion

### Planned next

- Public booking regression
- FO regression
- Customer regression
- Diagnostic reproduction coverage for known booking review issues

## Required local stack

- Web app running on `http://localhost:3000`
- API running on `http://localhost:3001`
- Dev endpoint enabled: `/api/v1/dev/playwright/admin-scenario`

## Run

From repo root:

```bash
./tools/dev/start-servelink.sh
cd apps/web
npm run test:e2e
```

### Optional env overrides

- `PLAYWRIGHT_BASE_URL`
- `PLAYWRIGHT_API_BASE_URL`
- `PLAYWRIGHT_ADMIN_EMAIL`
- `PLAYWRIGHT_ADMIN_PASSWORD`
- `PLAYWRIGHT_CUSTOMER_EMAIL`
- `PLAYWRIGHT_CUSTOMER_PASSWORD`
- `PLAYWRIGHT_FO_EMAIL`
- `PLAYWRIGHT_FO_PASSWORD`
- `TARGET_FO_ID`

## Structure

- **smoke/** — fast release-blocking validation
- **regression/** — deeper role/domain suites
- **diagnostics/** — bug reproduction and deep triage
- **fixtures/** — role-aware Playwright fixtures
- **helpers/** — auth, scenario, page helpers
- **assertions/** — reusable assertion contracts
- **selectors/** — stable selector definitions

## Design rules

- Use deterministic scenario data where possible
- Prefer semantic selectors first
- Use data-testid for critical contracts
- Keep tests deterministic and worker-safe
- Prefer scenario ids over ad hoc record lookup
- Separate smoke, regression, and diagnostics deliberately
