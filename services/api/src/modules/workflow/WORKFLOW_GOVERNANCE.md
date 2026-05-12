# Workflow Governance + Safety Architecture V1

## Principles

- **Human-governed first**: automation steps that touch customers, money, or dispatch require explicit approval gates (see `workflow-governance.ts`).
- **Observe before act**: Phase 11 workflows persist **interpretation + pipeline outcomes** only; they do **not** mutate bookings or payments.
- **Replay safety**: workflow executions keyed by **`triggeringOutboxEventId`** (unique) so replays do not duplicate observe-only rows.

## Versioning

- **`WORKFLOW_CONTRACT_VERSION`** — semantics of `payloadJson` interpretation (`workflow.constants.ts`).
- **`WORKFLOW_GOVERNANCE_VERSION`** — safety rail catalog bumps (`workflow-governance.ts`).
- **`workflowVersion` / `stepVersion`** — per-type incremental versioning at persistence layer.

## Prohibited autonomous actions

Listed in `PROHIBITED_AUTONOMOUS_WORKFLOW_ACTIONS`. Future runners must assert guards before emitting side-effects.

## Human-required categories

`HUMAN_APPROVAL_REQUIRED_WORKFLOW_CATEGORIES` — any workflow touching these domains must model approval signals **before** execution (future phases).

## Observe-only categories

`OBSERVE_ONLY_WORKFLOW_CATEGORIES` — allowed for audit/delivery coordination visibility **without** approval when recording facts only.

## Phase 12 — execution engine + modes

- **`WorkflowGovernanceExecutionGuard`** refuses unknown capabilities, **`execution_disabled`**, and approval gaps when mode is **`approval_required`**.
- **`WORKFLOW_ENGINE_EXECUTION_MODE`** env (see `workflow-execution-modes.ts`) stamps **`WorkflowExecution.executionMode`** at create time — default **`observe_only`**.
- Step runners are **deterministic** and **non-destructive** in Phase 12; prohibited autonomous actions remain catalogued and enforced by capability matrix + guard.
