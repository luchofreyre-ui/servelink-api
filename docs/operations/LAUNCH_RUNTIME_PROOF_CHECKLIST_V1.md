# Launch runtime proof checklist (v1)

Deterministic proof sequence for launch-facing Nu Standard runtime validation. This checklist consolidates deploy parity, manual subsystem proof, cron prerequisites, rollback checks, and evidence capture.

This is documentation only. It does not deploy, enable cron, mutate env, or claim production status.

---

## Truth layers

| Layer | Proves | Does not prove |
|---|---|---|
| Merge truth | SHA is on `origin/main` | Production is updated |
| Deploy truth | Railway/Vercel reports a successful artifact for a target env | Runtime routes, DB, or env behavior are correct |
| Runtime proof | Health/readiness/routes work in target env | Cron or batch automation is safe |
| Automation authorization | A governed `ENABLE_*` decision has proof and rollback | Feature correctness outside that subsystem |

---

## 1. Deploy parity verification

- [ ] Capture expected source SHA from `origin/main`.
- [ ] Confirm no dirty-tree API upload risk before any Railway CLI action.
- [ ] Capture Railway API deployment ID, timestamp, actor, and target environment.
- [ ] Capture Vercel/web deployment URL, timestamp, actor, and target environment.
- [ ] Capture **API version proof** from `GET https://<prod-api>/api/v1/system/version`.
- [ ] Capture **web version proof** from `GET https://<prod-web>/api/version`.
- [ ] Confirm web points at the intended API base URL.
- [ ] Confirm `NEXT_PUBLIC_*` build-time toggles match the intended web artifact when customer UX depends on them.

Do not infer deploy truth from merge truth.
Do not infer commit parity from healthy routes alone. `version.gitSha` must match the expected `origin/main` SHA for the relevant API/web artifact. If either endpoint returns `unknown`, record the gap and treat commit parity as unproven until build metadata is wired for that environment.

---

## 2. Railway/Vercel runtime proof

- [ ] API health probe returns expected success shape.
- [ ] API readiness probe returns expected success shape.
- [ ] API version endpoint returns only non-secret metadata: `service`, `version.gitSha`, `version.shortGitSha`, `version.buildTime`, and `version.source`.
- [ ] Web version endpoint returns only non-secret metadata: `service`, `version.gitSha`, `version.shortGitSha`, `version.buildTime`, and `version.source`.
- [ ] Railway boot logs show migration/boot markers appropriate to the release.
- [ ] Authenticated admin/customer/FO routes return auth-appropriate statuses, not unexpected 404s.
- [ ] Public booking route loads without newly introduced systematic 404 or API-base mismatch errors.
- [ ] Customer portal route loads and shows human-readable loading/error/empty states.

Capture timestamped excerpts. Redact secrets and customer data.

---

## 3. Manual subsystem proof before cron

Manual proof is required before any governed cron enablement.

| Subsystem | Manual proof expectation |
|---|---|
| Dispatch | Confirm bookings progress under the owned launch cadence; inspect backlog and exception surfaces before `ENABLE_DISPATCH_CRON`. |
| Operational analytics warehouse | Authenticated `POST /api/v1/admin/operational-intelligence/refresh-snapshots`, then `GET /api/v1/admin/operational-intelligence/refresh-runs?limit=20`. Capture counters, status, freshness before/after, and active-run semantics. |
| Workflow timers | Run or document `POST /api/v1/admin/workflow-executions/timers/process-once` cadence before `ENABLE_WORKFLOW_TIMER_WAKE_CRON`. |
| Billing lifecycle reconciliation | Confirm webhook parity, anomaly surfaces, and `CronRunLedger` semantics before relying on payment reconciliation cadence. |
| Remaining balance authorization | Confirm Stripe authorization behavior and customer billing support posture before relying on scheduled authorization. |
| Refund/integrity sweeps | Confirm finance owner, queue/anomaly review, and rollback ownership before any scheduled sweep. |
| Operational outbox | Reconcile current source owner first; docs reference a cron flag, but current source consumer must be confirmed before any enablement claim. |

---

## 4. Cron enablement prerequisites

- [ ] `ENABLE_RUNTIME_MATRIX_V2.md` row reviewed by subsystem owner.
- [ ] Target env current value captured.
- [ ] Manual proof completed in the same target environment.
- [ ] `CronRunLedger` or equivalent operational visibility verified.
- [ ] Rollback value and owner written down before enabling.
- [ ] Customer-visible impact and support fallback understood.
- [ ] Enablement window approved by operator/on-call.

Do not batch-enable unrelated crons.

---

## 5. Operational analytics refresh proof sequence

1. Confirm deploy parity for API and admin web.
2. Open admin operational intelligence and note current freshness state.
3. Run authenticated manual `POST /api/v1/admin/operational-intelligence/refresh-snapshots`.
4. Verify success response and captured row/counter summary.
5. Run `GET /api/v1/admin/operational-intelligence/refresh-runs?limit=20`.
6. Confirm latest run status, trigger source, requester, duration, warnings, and stale-start reconciliation behavior.
7. Confirm dashboard freshness copy distinguishes manual refresh from optional cron.
8. Only after successful manual proof, consider whether `ENABLE_OPERATIONAL_ANALYTICS_WAREHOUSE_REFRESH_CRON=true` is still needed.

---

## 6. Rollback verification

- [ ] For opt-in crons, remove/unset `true` and verify `disabled_by_env` skipped rows.
- [ ] For inverted billing crons, set explicit `false` and verify skipped rows.
- [ ] Confirm customer-facing route health after rollback.
- [ ] Confirm admin visibility still explains manual cadence or disabled automation.
- [ ] Capture rollback timestamp, actor, and evidence excerpt.

---

## 7. Post-deploy smoke expectations

- [ ] Public booking start, estimate/review, deposit continuation, and confirmation surfaces load.
- [ ] Expired hold copy distinguishes refreshed hold from unavailable slot when applicable.
- [ ] Customer portal list/detail pages show visit labels, safe payment wording, and no raw debug JSON.
- [ ] FO visit detail can start/complete with inline error handling.
- [ ] Admin command center shows cron/freshness state with governed-disabled semantics.
- [ ] Admin lifecycle actions show inline retry/escalation guidance on failure.

---

## 8. Evidence capture bundle

Minimum launch runtime proof bundle:

1. Source SHA and PR/merge reference.
2. API deploy ID and web deploy URL.
3. API and web version response excerpts, compared against the source SHA.
4. Health/readiness response excerpts.
5. Auth route parity excerpt.
6. Manual subsystem proof excerpts.
7. `ENABLE_*` env snapshot excerpt for touched subsystem only.
8. Rollback plan and rollback proof if exercised.
9. Operator/on-call identity and timestamp.

**STOP:** Without this bundle, do not claim production-operational, cron-enabled, or runtime-proven status.
