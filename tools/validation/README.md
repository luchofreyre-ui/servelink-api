# Servelink Validation Harness

## Purpose

This runner validates the local Servelink system in a repeatable way and writes both markdown and JSON reports.

It checks:

- repo layout
- required commands
- API reachability
- web reachability
- admin auth
- admin exceptions/activity endpoints
- booking-level operator read models
- booking-level write smoke actions
- approve/reassign smoke actions
- API build
- API tests
- web build

## Required local runtime

Before running the harness, start both apps.

### Tab 2 — API

```bash
cd ~/Desktop/servelink/services/api && npm run dev
```

### Tab 3 — Web

```bash
cd ~/Desktop/servelink/apps/web && npm run dev
```

### Expected ports

- **API:** http://localhost:3001
- **Web:** http://localhost:3000

## Core environment variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `TEST_BOOKING_ID` | Real booking to validate | empty |
| `TARGET_FO_ID` | FO id for approve/reassign smoke. Auto-discovered if omitted (booking `foId`, else earliest `FranchiseOwner`). | empty |
| `VALIDATION_MODE` | `fast` or `full` | `full` |
| `FAIL_FAST` | Stop on first failure (`1` / `0`) | `0` |
| `RUN_WRITE_SMOKE` | Enable booking write smoke | `1` |
| `RUN_API_BUILD` | Run API build | `1` |
| `RUN_API_TESTS` | Run API test suite | mode-dependent (`0` in `fast` unless set) |
| `RUN_WEB_BUILD` | Run web build | mode-dependent (`0` in `fast` unless set) |

## Modes

### Full

Runs the complete validation flow.

```bash
cd ~/Desktop/servelink && TEST_BOOKING_ID=cmmwkthw5007lsa43oltazcct ./tools/validation/validate-servelink.sh
```

### Fast

Skips long-running checks by default:

- API tests
- web build

```bash
cd ~/Desktop/servelink && VALIDATION_MODE=fast TEST_BOOKING_ID=cmmwkthw5007lsa43oltazcct ./tools/validation/validate-servelink.sh
```

You can still force builds/tests back on in fast mode:

```bash
cd ~/Desktop/servelink && VALIDATION_MODE=fast RUN_API_TESTS=1 RUN_WEB_BUILD=1 TEST_BOOKING_ID=cmmwkthw5007lsa43oltazcct ./tools/validation/validate-servelink.sh
```

## Examples

### Fast run

```bash
cd ~/Desktop/servelink && VALIDATION_MODE=fast TEST_BOOKING_ID=cmmwkthw5007lsa43oltazcct ./tools/validation/validate-servelink.sh
```

### Full run

```bash
cd ~/Desktop/servelink && TEST_BOOKING_ID=cmmwkthw5007lsa43oltazcct ./tools/validation/validate-servelink.sh
```

### Fail-fast run

```bash
cd ~/Desktop/servelink && FAIL_FAST=1 VALIDATION_MODE=fast TEST_BOOKING_ID=cmmwkthw5007lsa43oltazcct ./tools/validation/validate-servelink.sh
```

### Explicit FO run

```bash
cd ~/Desktop/servelink && VALIDATION_MODE=fast TEST_BOOKING_ID=cmmwkthw5007lsa43oltazcct TARGET_FO_ID=YOUR_REAL_FO_ID ./tools/validation/validate-servelink.sh
```

## Outputs

Reports are written to:

`~/Desktop/servelink/tools/validation/reports/`

Each run produces:

- one markdown summary report
- one JSON report (includes `actionResults` and per-phase items)
- one raw log file

## Notes

The harness resets/seeds a known admin user:

- **email:** `admin@servelink.local`
- **password:** `Passw0rd!`

Booking-level checks are skipped unless `TEST_BOOKING_ID` is provided.

Approve/reassign smoke attempts auto-discovery of `TARGET_FO_ID` when omitted.

The script exits non-zero if any validation phase fails.

---

## 3) Run this exact command

```bash
cd ~/Desktop/servelink && VALIDATION_MODE=fast TEST_BOOKING_ID=cmmwkthw5007lsa43oltazcct ./tools/validation/validate-servelink.sh
```

## What I want back

Paste the terminal output.

This run should tell us immediately whether auto-discovered approve/reassign smoke is viable in your local data.
