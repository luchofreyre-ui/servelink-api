# ENABLE runtime matrix (v2)

Authoritative repo-discovered inventory for `ENABLE_*` toggles visible in `services/api`, `apps/web`, and `docs` during Phase L launch consolidation.

This document is governance only. It does not assert Railway, Vercel, or production environment values.

---

## Authority boundaries

- **Merged != deployed**. Source evidence only proves repository semantics.
- **Env value != runtime proof**. Operators must capture target-environment snapshots before any enablement claim.
- **Cron enabled != cron safe**. Manual subsystem proof, `CronRunLedger` visibility, and rollback readiness remain separate gates.
- **Default OFF until proof** is the launch posture for opt-in automation unless code uses inverted semantics.

---

## Matrix

| Flag | Owning subsystem | Repo source | Default expected state from code/docs | Launch-critical vs optional | Expected OFF until proof | Proof before enablement | Rollback expectation | Risk | Customer-visible impact |
|---|---|---|---|---|---|---|---|---|---|
| `ENABLE_DISPATCH_CRON` | Dispatch offer expiry and assigned-start SLA sweeps | `services/api/src/modules/dispatch/dispatch.worker.ts` | Off unless exactly `true` | Conditional launch-critical if no manual dispatch cadence owns progression | Yes | Verify dispatch backlog/SLA posture, `CronRunLedger` started/succeeded rows, failed-run handling, and operator ownership of no-candidate paths | Remove/unset truthy value; confirm `disabled_by_env` skipped rows and manual cadence resumes | High | Yes, delayed assignment or visit progression can affect customers |
| `ENABLE_OPERATIONAL_ANALYTICS_WAREHOUSE_REFRESH_CRON` | Operational analytics warehouse refresh | `services/api/src/modules/operational-analytics/operational-analytics-warehouse-refresh.cron.ts` | Off unless exactly `true` | Optional/post-launch automation candidate | Yes | Successful authenticated manual `POST /api/v1/admin/operational-intelligence/refresh-snapshots`, counters captured, `GET refresh-runs` visibility, staleness copy understood | Remove/unset truthy value; confirm skipped ledger rows and continue manual refresh | Medium | Indirect only; stale admin intelligence can affect operator decisions |
| `ENABLE_WORKFLOW_TIMER_WAKE_CRON` | Workflow timer wake | `services/api/src/modules/workflow/workflow-timer-wake.cron.ts` | Off unless exactly `true` | Conditional if workflow timers are operationally relied upon | Yes | Timer backlog reviewed, manual `timers/process-once` alternative documented or cron proof accepted, `CronRunLedger` visible | Remove/unset truthy value; use manual process-once cadence if needed | Medium-high | Indirect; stalled workflows can delay operational follow-up |
| `ENABLE_REFUND_CRON` | Refund reconciliation safety-net cron | `services/api/src/modules/billing/refunds.cron.service.ts` | Off unless exactly `true` | Optional/post-launch finance automation | Yes | Finance owner approval, refund queue/anomaly review, successful ledger run in target env | Remove/unset truthy value; confirm skipped rows and manual refund controls | High | Potentially yes, if refunds depend on automation |
| `ENABLE_INTEGRITY_SWEEP` | Billing integrity sweep | `services/api/src/modules/billing/integrity.sweep.cron.ts` | Off unless exactly `true` | Should-have finance hygiene | Yes | Sweep blast radius reviewed, anomaly surfaces monitored, successful ledger run sampled | Remove/unset truthy value; continue manual finance review | High | Indirect; payment/accounting trust can affect support |
| `ENABLE_PAYMENT_LIFECYCLE_RECONCILIATION_CRON` | Payment lifecycle reconciliation | `services/api/src/modules/billing/payment-lifecycle-reconciliation.cron.service.ts` | Inverted: on unless explicitly `false` | Should-have finance integrity | No, inverted code semantics; env truth still unknown | Confirm target env value, ledger rows for `payment_lifecycle_reconciliation`, anomaly volume, Stripe/webhook parity | Set explicitly to `false`; confirm skipped rows and manual reconciliation coverage | High | Yes, checkout/deposit state recovery can affect customers |
| `ENABLE_REMAINING_BALANCE_AUTH_CRON` | Remaining balance authorization | `services/api/src/modules/billing/remaining-balance-authorization.cron.service.ts` | Inverted: on unless explicitly `false` | Conditional finance automation | No, inverted code semantics; env truth still unknown | Confirm target env value, Stripe authorization behavior, ledger rows, failed auth handling | Set explicitly to `false`; confirm skipped rows and manual capture/authorization process | High | Yes, balance collection affects customer billing experience |
| `ENABLE_STRUCTURED_BOOKING_METADATA_SHADOW` | Booking metadata read-path shadow | `services/api/src/modules/bookings/booking-operational-metadata-shadow.ts` | Off when unset/empty; truthy parser accepts `true`/`1` | Optional diagnostics | Yes | Verify shadow logs/metrics are non-authoritative and contain no customer-facing leakage | Unset or set non-truthy; confirm shadow output stops | Low-medium | No direct customer impact |
| `ENABLE_SERVICE_MATRIX_SHADOW` | Service matrix shadow sampling | `services/api/src/modules/service-matrix/service-matrix-shadow-config.ts`; `docs/engineering/SERVICE_MATRIX_S2_SHADOW_INTEGRATION_DESIGN_V1.md` | Off when unset or malformed | Optional diagnostics | Yes | Staged soak, sample-rate proof, log sink review, PII/no-enforcement confirmation | Unset or set false; set sample rate to `0` | Low-medium | No direct customer impact if shadow-only |
| `ENABLE_OPERATIONAL_OUTBOX_PROCESSOR_CRON` | Operational outbox processor | Current code consumer not found in `services/api/src`; referenced by audits/matrix docs | Docs describe off unless exactly `true`; current source truth must be reconciled before use | Conditional, if outbox delivery depends on processor cadence | Yes | STOP until source consumer or replacement worker is identified; then prove process-once or cron path, queue depth, latency, and ledger semantics | Disable/unset once source owner is identified; use manual process-once if available | High if actually active; unknown until source reconciliation | Potentially yes, delayed operational/customer messages |
| `ENABLE_ORCHESTRATION_BOOKING_TRANSITION_INVOCATION` | Admin workflow approval guidance | `apps/web/src/components/admin/AdminWorkflowApprovalsSection.tsx` copy-only reference | No repo-local `process.env` consumer found | Not an activation flag until backend consumer exists | Yes, treat as documentation-only | STOP before any enablement claim; implement/govern consumer only through Phase 0 if ever required | No runtime rollback available from current source | Medium governance risk if mistaken as live | No direct impact from current source |

---

## Related non-`ENABLE_*` launch toggles

These are not `ENABLE_*` flags but still require deploy parity because they alter web behavior at build time:

- `NEXT_PUBLIC_ENABLE_MANUAL_PAYMENT_CONTROLS`
- `NEXT_PUBLIC_ENABLE_BOOKING_UI_TELEMETRY`

---

## Operating rule

Before changing any flag in a target environment, operators must attach:

1. Target environment and current env snapshot excerpt.
2. Owning subsystem proof sequence.
3. Rollback command/owner.
4. Evidence capture location.
5. Confirmation that merge, deploy, runtime proof, and automation authorization are separate truth layers.

**STOP:** This file is not production truth and does not authorize cron enablement.
