# SYSTEM OPERATIONS PROTOCOL (v1)  
### Workbook Reconciliation Constitution — Procedural Tier

**Status:** **AUTHORITATIVE OPERATIONAL PROCEDURE** for all future Nu Standard + ServeLink execution until **formally superseded** by `SYSTEM_OPERATIONS_PROTOCOL_V2+` or successor.

**Relationship to the Master Execution Plan**

| Document | Authority |
|----------|-----------|
| [`NU_STANDARD_MASTER_EXECUTION_PLAN_V1.md`](./NU_STANDARD_MASTER_EXECUTION_PLAN_V1.md) | **WHAT** must run, **truth layers**, **completion definition**, **critical path remainder**, **safe automation conditions**, **STOP gates for scope**. |
| **This protocol** | **HOW** execution must occur: drops, validation, merge/deploy discipline, reporting, anti-drift law, chat startup. |

If **WHAT** vs **HOW** conflict, **Master Plan wins** for sequencing and completion; **Protocol wins** for procedural mechanics unless Master Plan explicitly overrides.

**This is not:** another audit, roadmap, agile theater, or enterprise bureaucracy.

**This is:** rigid operational law grounded in **real drift failures** already documented (merge≠deploy, silent cron skips, registry/schema drift, duplicate authority risk, fragmented drops, unverified prod assumptions).

---

## Phase 0 — Workbook reconciliation

### Repo-native sources (durable doctrine)

There is **no** checked-in file named `SYSTEM_TRUTH` workbook in this repository. **Operational law** is reconciled from:

| Source | Doctrine extracted |
|--------|-------------------|
| Master Execution Plan | Authority ranks, truth layers, phases, locks, rehydration, safe automation |
| Critical Path + Completion Census | Deploy/env matrix urgency; governed-but-disabled crons; merge≠deploy |
| Phase 0 + Primitive Registry | Inspection before implementation; classifications; duplicate-authority STOP |
| OA merge proof + warehouse governance | Manual proof before cron; correlate planes; audit visibility |
| Merge/deploy CI docs | Squash expectations; migration immutability; PR CI gates |
| **Proven execution patterns** (project history) | Super drops (single governed lane), governance-only commits, WIP branch preservation + `reset --hard main` after safe commit, PR scope diff verification, `gh pr checks --watch` before merge |

### Operational law vs conversational noise

| Keep (law) | Discard (noise) |
|------------|-----------------|
| Explicit constraints (`Hard constraints`, `STOP`, `Do not merge`) | Informal “quick fixes” without scope |
| File-scope verification (`git diff --cached --name-only`) | “Just ship it” without diff |
| Phase 0 + classification in PR body | Drive-by new tables/services |
| Evidence-backed runtime language | Declaring prod parity without HTTP/Railway checks |

---

## Phase 1 — Execution philosophy

Each rule exists because **without it**, the repo has exhibited or risks: **silent skew**, **duplicate authorities**, **automation false confidence**, **trust collapse**, **merge/deploy hallucination**.

| Principle | Meaning | Why it exists |
|-----------|---------|----------------|
| **Super drops default** | One governed lane per major deliverable with internal phases + STOP gates | Prevents fragmented narratives and conflicting partial merges |
| **Anti-fragmentation** | Prefer one coherent PR/branch per authority plane change | Duplicate PRs → duplicate execution truth |
| **Governance before automation** | Phase 0 + env/runbook before flipping `ENABLE_*` | Cron **skip** paths already shipped—unknown env = unknown ops |
| **Runtime proof before autonomy** | Manual POST / ledger proof before cadence | Warehouse + billing governance docs |
| **Trust before sophistication** | Branding/portal credibility before new features | Experience audits |
| **Operational safety before scaling** | Deploy parity + anomaly discipline before load | Census / deploy governance lesson |
| **Evidence before assumption** | `git show`, CI, logs—not chat inference | Registry/schema drift case |
| **Repo/runtime truth before speculation** | Distinguish merged vs deployed vs disabled | Critical Path CP-1/CP-2 |
| **Anti-duplicate-authority** | One narrative per plane; correlate—don’t fork ledgers | Registry §12 |
| **Anti-local-optimization** | No “small cleanup” that splits authority or bypasses Phase 0 | Local polish creating global ambiguity |

---

## Phase 2 — Cursor drop constitution

### Default: governed super drop

A **super drop** is a single chat-owned execution with:

1. **Declared objective** and **hard constraints** (explicit list).
2. **Internal phases** (e.g. Phase 0 inspection → implementation → validation → report).
3. **Mandatory STOP conditions** (ambiguous authority, conflicting primitives, unknown prod truth when needed).
4. **Completion report** (files, hashes, validation, constraints confirmation, unresolved risks).

### Mandatory phases (when touching execution/governance primitives)

- **Phase 0 inspection** per [`PHASE_0_AND_PRIMITIVE_CLASSIFICATION_V1.md`](./PHASE_0_AND_PRIMITIVE_CLASSIFICATION_V1.md): schema search, module grep, tests search, **classification verdict**, duplicate-authority check.

### Mandatory STOP — proceed only after resolution

| Condition | Action |
|-----------|--------|
| Conflicting authorities for same outcome | STOP — design doc / registry update / explicit REPLACE or CORRELATE plan |
| Unknown **`origin/main` vs branch** divergence for the same primitive | STOP — fetch, diff, reconcile |
| Unknown **deployed SHA** while claiming prod behavior | STOP — label UNKNOWN; require parity checks |
| Runtime truth mismatch (CI green vs prod 404 historical pattern) | STOP — deploy verification before narrative |

### Mandatory reporting sections (completion report)

- Branch / commits / PR (# if applicable).
- **Exact file list** (`git diff origin/main...HEAD --name-only` or equivalent).
- **Validation**: commands run + pass/fail.
- **Constraints**: merge/deploy/cron/env untouched unless explicitly in scope.
- **Unresolved risks**.

### Implementation boundaries

- **Constraint formatting:** User-supplied `Hard constraints` are **binding**; declining scope requires explicit pushback in-chat, not silent shrink.
- **Runtime/deploy language:** Use **merged**, **deployed**, **runtime-proven**, **governed-but-disabled**—never merge these words.
- **Branch/PR expectations:** Isolated commits for isolated concerns (governance-only vs feature); verify staged scope before commit.

### When small drops are allowed

- **Docs-only** typo/fix with zero execution impact.
- **Single-file** bugfix **outside** ledger/cron/payment/dispatch authority—with Phase 0 waived only if **touch list** explicitly excludes primitives (user + reviewer judgment).
- **Emergency prod hotfix** — still requires post-hoc registry/Phase 0 note in follow-up PR *unless* explicitly waived by Master Plan tier authority.

### Explicitly forbidden

- Vague “improve booking” without surfaces and acceptance.
- Implementation **without** validation (typecheck/tests/CI as applicable).
- Speculative new orchestration / platforms **without** registry row + Phase 0 classification.
- Fragmented micro-drops **without** risk justification when they split one authority narrative across PRs.

---

## Phase 3 — Branch / merge / deploy governance

### Branch discipline

- **Feature branches** off current `origin/main` (or designated integration branch).
- **WIP preservation:** Never delete uncommitted work—use dedicated `feat/*-wip` commit **before** `reset --hard` sync patterns when instructed.
- **Dirty tree:** Do not commit unrelated files; use explicit `git add` paths; verify `git diff --cached --name-only`.

### Merge / PR

- **PR scope:** Diff must match declared lane; reject scope creep in same PR unless Master Plan allows bundling.
- **Squash-merge** default for feature lanes when history cleanliness required (per merge-drop patterns).
- **CI:** `gh pr checks <n> --watch` (or equivalent) **green** before merge when policy requires—do not merge on failing gates.
- **Migrations:** Forward-only; immutable landed migrations per [`ci-and-merge-governance-v1.md`](../operations/ci-and-merge-governance-v1.md) / engineering prisma docs.

### Truth separation (mandatory vocabulary)

| Statement | Allowed inference |
|-----------|-------------------|
| **Merged** | SHA on `origin/main` |
| **Deployed** | **Nothing**—verify Railway/Vercel per [`production-deployment-governance-v1.md`](../operations/production-deployment-governance-v1.md) |
| **Runtime proof** | Health/readiness, migration logs, route probes **in target env** |
| **Automation authorization** | Policy + env **`ENABLE_*`** + ledger proof—**orthogonal** to merge |

### When deploys are allowed / forbidden

| Situation | Deploy |
|-----------|--------|
| Operator explicitly requests deploy **and** parity checklist satisfied | Allowed per ops doc |
| “Main is green” only | **Insufficient** — not automatic prod truth |
| Lane forbids deploy | **Forbidden** |
| Unverified dirty tree / wrong SHA | **Forbidden** ([`railway-deploy-hygiene-v1.md`](../operations/railway-deploy-hygiene-v1.md)) |

### When runtime proof is mandatory

- Before claiming **production-operational**.
- Before **cron enablement** or batch automation ([§Phase 8](#phase-8--runtime-proof--automation-governance)).
- After **schema migrations** touching prod-critical paths.

---

## Phase 4 — Runtime proof + automation governance

### Cron doctrine

- Crons **exist** in code; many **skip** unless `ENABLE_* === "true"` (exact semantics per service).
- **Default posture:** governed-but-disabled until proof + authorization.
- **No cron enablement** in Cursor drops unless user explicitly authorizes **and** Master Plan / warehouse governance satisfied.

### Browser / auth boundary doctrine

- Admin/customer/FO surfaces require JWT + role; Playwright seeds documented for CI—not assumed for prod demos.

### Manual-proof-first

- Example: warehouse refresh **`POST refresh-snapshots`** success before scheduling cron ([`warehouse-refresh-scheduling-governance-v1.md`](../operations/warehouse-refresh-scheduling-governance-v1.md)).

### Single-flight / stale reconciliation / auditability

- Respect **`OperationalAnalyticsRefreshRun`** (manual plane) vs **`CronRunLedger`** (cron plane)—**correlate**, don’t duplicate (registry + OA proof).

### Before cron / autonomous cadence / scaling automation

Satisfy **Master Plan Phase 8** checklist: runtime proof, correlation where dual planes, operational visibility, staleness literacy, Phase 0 alignment, **no duplicate authority ambiguity**.

---

## Phase 5 — Anti-drift + anti-duplicate-authority law

### Definitions

| Term | Definition |
|------|------------|
| **Duplicate authority** | Two primitives decide the same outcome without documented correlation (e.g. dual “refresh succeeded” ledgers). |
| **Governance drift** | Skipping Phase 0, registry updates, or env documentation while changing execution narrative. |
| **Execution drift** | Work outside Master Plan allowed lanes without superseding plan. |
| **Launch-sequence drift** | Automation/scaling before trust + operational gates. |
| **Backend overbuilding** | New servers/models while trust/portal/deploy blockers open (Master Plan §Phase 4). |
| **Local optimization drift** | Small changes that bypass global reuse rules. |
| **Speculative expansion drift** | AI/platform/nice-to-have while MUST_HAVE open. |

### Mandatory behaviors

- **Phase 0** for primitives touching ledgers, cron, locks, workflow execution, replay audit planes.
- **Primitive reuse analysis** in PR description (template-aligned).
- **Execution-phase reconciliation** — identify Master Plan active phase before large work.
- **Runtime-truth reconciliation** — merged vs deployed stated explicitly.

### MUST STOP (hard)

- Requested work **violates** Master Plan sequencing or Phase 8 automation gates.
- **Ambiguous** deployed env or secret-dependent behavior blocking verification.
- **New ledger/run primitive** proposed without classification verdict.

---

## Phase 6 — Chat rehydration operations

**Startup order for every future chat:**

1. Read **[`NU_STANDARD_MASTER_EXECUTION_PLAN_V1.md`](./NU_STANDARD_MASTER_EXECUTION_PLAN_V1.md)** (WHAT / phase / locks).
2. Read **this protocol** (HOW / drops / merge / reporting).
3. Reconcile **`git fetch`**, `origin/main` SHA, **deployed truth** (if task needs prod), **active branches**, **blockers**, **governed-but-disabled** systems.
4. Identify **active execution phase** (Master Plan §Phase 3).
5. Select **only allowed next lanes**.
6. Confirm **no forbidden drift** (Master Plan §Phase 4 + this §Phase 5).

**Evidence before direction change**

- Show **why** the lane is allowed (mapping to Master Plan + audits).
- Show **Phase 0 classification** if touching primitives.
- Do **not** reprioritize MUST_HAVE into post-launch without updating Master Plan tier document.

---

## Phase 7 — Operational reporting standards

### Required in completion reports

| Element | Standard |
|---------|----------|
| File / migration scope | Exact paths or `git diff` name-only |
| Validation | Commands + outcomes (`npm run …`, `gh pr checks`) |
| Merge/deploy | Explicit yes/no + hashes |
| Constraints | Checkbox-style confirmation |
| Unresolved risks | Honest list |

### Insufficient proof / weak reporting

| Failure mode |
|--------------|
| “Tests passed” without naming suite or scope |
| “Prod works” without parity checklist reference |
| Missing file list for governance-sensitive merges |
| Omitting **cron/deploy/env untouched** when relevant |

### Unverifiable claims

- Treat as **UNKNOWN**; do not upgrade to PROVEN without evidence.

---

## Phase 8 — Operational safety boundaries

| Boundary | Rule |
|----------|------|
| Production mutations | No hidden prod DB/API changes from agent unless user explicitly scoped |
| Secrets | Do not echo JWT/session/cookies; do not commit `.env` |
| Admin mutations | Document blast radius; prefer read-only unless lane requires writes |
| Automation | No `ENABLE_*` flip unless user + Master Plan authorize |
| Deploy | No deploy unless lane explicitly allows |
| Destructive git | No `reset --hard` / branch delete **unless** user authorized + WIP preserved per protocol |
| Runtime assumptions | Label unknowns |

**Escalation:** STOP chat execution; surface ambiguity to human operator with concrete questions.

---

## Phase 9 — Final operational truth

1. **Strengths:** CI gate + governance docs + registry + Phase 0 script + super-drop discipline already proven in-repo.
2. **Weaknesses:** Deploy/env truth external to Git; cron posture invisible without runbooks; portal/trust debt can tempt “quick UI” without Phase 0.
3. **Most important anti-drift protections:** Master Plan hierarchy + Phase 0 + merge≠deploy vocabulary + scope-verified commits.
4. **Most dangerous failure modes:** Assuming green CI ⇒ prod; enabling cron without proof; splitting authority across PRs.
5. **Most dangerous merge/deploy mistakes:** Deploy from dirty tree; merge without check watch; API-only merge without deploy ⇒ 404 parity skew.
6. **Most dangerous runtime-proof mistakes:** Treating ledger **skipped** rows as success; confusing analytics staleness with live outage.
7. **Most dangerous UX/ops coordination:** Shipping trust-blocked UX while ops believes automation is on—or vice versa.
8. **Never regress below:** Phase 0 for primitives; explicit truth-layer language; isolated governance commits; no merge on red CI when policy requires green; no silent cron enablement.

---

## Dual constitution closure

**Together:**

- **Master Execution Plan** = strategic **system truth** for *what* and *when*.
- **System Operations Protocol** = procedural **system truth** for *how*.

**Supersession:** Only a formally named successor (`SYSTEM_OPERATIONS_PROTOCOL_V2` or merged constitution revision) may replace this document as procedural tier.

---

**STOP** — procedural constitution authored; no feature implementation, merge, deploy, or cron performed in this drop.
