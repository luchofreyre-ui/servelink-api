## Summary

<!-- What changed and why (1–3 sentences). -->

## Scope / risk

<!-- Low / medium / high — note migrations, auth, payments, cron flags. -->

## Phase 0 & primitive classification (major lanes)

_Check when this PR introduces or moves execution ledgers, cron semantics, locks, workflow state, replay/audit planes, or operational analytics authority._

- [ ] **Phase 0:** Consulted [`docs/governance/ARCHITECTURE_PRIMITIVE_REGISTRY_V1.md`](docs/governance/ARCHITECTURE_PRIMITIVE_REGISTRY_V1.md) and searched adjacent modules/schema for overlapping primitives.
- [ ] **Classification (pick one primary):** `REUSE_EXISTING_PRIMITIVE` · `EXTEND_EXISTING_PRIMITIVE` · `CORRELATE_EXISTING_PRIMITIVES` · `REPLACE_CONFLICTING_PRIMITIVES` · `NEW_PRIMITIVE_JUSTIFIED` · `STOP_CONFLICTING_AUTHORITIES` (design-only — see protocol doc).
- [ ] **Duplicate-authority check:** No parallel ledger/lease for the same narrative without documented correlation (see [`PHASE_0_AND_PRIMITIVE_CLASSIFICATION_V1.md`](docs/governance/PHASE_0_AND_PRIMITIVE_CLASSIFICATION_V1.md)).

**Declared classification:**

```text
Primitive classification:
Registry rows consulted:
Duplicate-authority check:
```

## Validation

- [ ] `npm run check:governance-docs` (root) if governance docs changed
- [ ] Package-local typecheck/tests as usual for touched areas
