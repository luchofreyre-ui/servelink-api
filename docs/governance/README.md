# ServeLink governance docs

Permanent references for **implementation discipline** and **anti-duplication** of architecture primitives.

| Document | Purpose |
|----------|---------|
| [`ARCHITECTURE_PRIMITIVE_REGISTRY_V1.md`](./ARCHITECTURE_PRIMITIVE_REGISTRY_V1.md) | Canonical map of repo primitives (models, services, patterns) with reuse guidance |
| [`PHASE_0_AND_PRIMITIVE_CLASSIFICATION_V1.md`](./PHASE_0_AND_PRIMITIVE_CLASSIFICATION_V1.md) | Mandatory Phase 0 protocol, primitive classifications, duplicate-authority rules, STOP conditions |

**Validation:** `npm run check:governance-docs` (repo root) — also runs in **PR CI**.

**Related operations docs:** `docs/operations/ci-and-merge-governance-v1.md`, `docs/operations/warehouse-refresh-scheduling-governance-v1.md`

**Launch consolidation (CP-1 / CP-2 ops surfaces):** [`ENABLE_RUNTIME_MATRIX_V1.md`](../operations/ENABLE_RUNTIME_MATRIX_V1.md), [`DEPLOY_RUNTIME_PARITY_CHECKLIST_V1.md`](../operations/DEPLOY_RUNTIME_PARITY_CHECKLIST_V1.md), [`CONTROLLED_ACTIVATION_PLAYBOOK_V1.md`](../operations/CONTROLLED_ACTIVATION_PLAYBOOK_V1.md)
