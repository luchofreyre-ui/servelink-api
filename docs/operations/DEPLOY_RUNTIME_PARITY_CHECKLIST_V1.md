# Deploy / runtime parity checklist (v1)

Operator-grade verification checklist after merges/releases touching **Nu Standard / Servelink** API or web.

Companion artifacts:

- [`production-deployment-governance-v1.md`](./production-deployment-governance-v1.md)
- [`railway-deploy-hygiene-v1.md`](./railway-deploy-hygiene-v1.md)
- [`ENABLE_RUNTIME_MATRIX_V2.md`](./ENABLE_RUNTIME_MATRIX_V2.md)
- [`LAUNCH_RUNTIME_PROOF_CHECKLIST_V1.md`](./LAUNCH_RUNTIME_PROOF_CHECKLIST_V1.md)
- [`CONTROLLED_ACTIVATION_PLAYBOOK_V1.md`](./CONTROLLED_ACTIVATION_PLAYBOOK_V1.md)

---

## Truth layers (non‑negotiable)

| Truth | Meaning | Forbidden inference |
|-------|---------|---------------------|
| **Merge truth** | SHA landed on **`origin/main`** | **≠ production SHA** |
| **Deploy truth** | Artifact Railway/Vercel reports SUCCESS for service/environment | **≠ merged SHA automatically** |
| **Runtime proof** | HTTP + logs + DB migrations succeeded **for target deploy SHA** | **≠ cron-safe — cron ticks orthogonal ([`SYSTEM_OPERATIONS_PROTOCOL_V1.md`](../governance/SYSTEM_OPERATIONS_PROTOCOL_V1.md))** |

Explicit axioms:

- **Merged ≠ deployed**
- **Deployed ≠ runtime-proven**
- **Runtime-proven ≠ cron-safe**

---

## Preconditions before deploy

- [ ] **Known-good SHA** from **`origin/main`** (merge URL / squash merge hash documented).
- [ ] **`npm run check:railway-api-deploy-tree`** exits **0** immediately before **CLI** API uploads (`railway-deploy-hygiene-v1.md`).
- [ ] **Dirty-tree STOP**: no stray **`services/api/src/**`** / **`services/api/prisma/**`** uploads absent intentional commits (`railway-deploy-hygiene-v1.md`).
- [ ] **Railway API Dockerfile path:** confirm production service settings use the root **`Dockerfile`** with repo-root context unless an explicit Railway setting says otherwise; keep `services/api/Dockerfile` aligned only as fallback/reference.
- [ ] **API runtime metadata source:** for GitHub-connected Railway deploys, confirm **`RAILWAY_GIT_COMMIT_SHA`** is expected to populate runtime metadata; for CLI/manual deploys, inject **`GIT_COMMIT_SHA`** or **`COMMIT_SHA`** equal to the known-good `origin/main` SHA into the API runtime environment before upload.
- [ ] **API build-time context:** pass **`GIT_COMMIT_SHA`** and **`BUILD_TIME`** as Docker build args when available so the generated runtime metadata artifact can serve as a fallback; do not treat `BUILD_TIME` as commit parity proof.
- [ ] **Web parity**: when UX-critical **`NEXT_PUBLIC_*`** toggles matter — verify preview/production bundle baked flags (**UNKNOWN until inspected**) (`ENABLE_RUNTIME_MATRIX_V2.md` companion rows).

---

## Railway deploy procedure (API)

Follow **`production-deployment-governance-v1.md`** canonical path:

1. Prefer GitHub-connected deploy **Wait-for-CI**, relying on Railway-provided **`RAILWAY_GIT_COMMIT_SHA`** for runtime version metadata.
2. If using CLI/manual upload, run from **`git reset --hard`** clean **`origin/main`** at SHA and inject **`GIT_COMMIT_SHA`** or **`COMMIT_SHA`** equal to that SHA into the API runtime environment before deploy.
3. When Railway supports Docker build args for the service, also pass **`GIT_COMMIT_SHA`** and optional **`BUILD_TIME`** so the API build writes non-secret generated runtime metadata into the image.
4. Capture Railway deployment ID / timestamp / triggering actor (merge deploy discipline § Ownership).

*(Automations referenced below assume **`servelink-api`** production naming — unchanged governance posture.)*

---

## Post-deploy verification (immediate)

| Step | Action | Pass criterion |
|------|--------|----------------|
| Health probe | **`GET https://<prod-api>/api/v1/system/health`** | **200** + service health OK |
| Readiness | **`GET https://<prod-api>/api/v1/system/readiness`** | **200** + readiness semantics aligned Railway platform settings (`production-deployment-governance-v1.md`) |
| API version proof | **`GET https://<prod-api>/api/v1/system/version`** | **200** + non-secret `service: "servelink-api"` and `version.gitSha` matching target `origin/main` SHA; if `unknown`, **STOP** — API runtime commit parity is **not proven** |
| Web version proof | **`GET https://<prod-web>/api/version`** | **200** + non-secret `service: "servelink-web"` and `version.gitSha` matching target `origin/main` SHA; if `unknown`, web deploy parity is **not proven** |
| Migrations | Railway logs tail near boot | **`=== MIGRATION COMPLETE ===`** **when migrations landed**, **`=== CONTINUING TO NEST BOOT ===`** follow-through (`production-deployment-governance-v1.md`) |

`version.buildTime` is useful context for evidence ordering but is not equivalent to commit parity. A known `buildTime` with `version.gitSha: "unknown"` still fails API runtime parity proof.

---

## Runtime endpoint verification (examples — authenticated surfaces optional batch)

Document captured timestamps / principals separately — **not embedded here.**

### Operational analytics warehouse refresh

| Surface | Example probe | Expected semantics |
|---------|---------------|-------------------|
| Manual warehouse refresh | Authenticated **`POST /api/v1/admin/operational-intelligence/refresh-snapshots`** | **200** with **`ok: true`** shape carrying counters per OA governance lanes (**warehouse governance**) |
| Refresh-run ledger visibility | **`GET /api/v1/admin/operational-intelligence/refresh-runs?limit=20`** | **`200`** listing rows / **`activeRun`** semantics documented OA governance (**OperationalAnalyticsRefreshRun**) |
| **Single-flight / stale expectation** | Overlap orchestrations intentionally avoided — governance posture expects bounded concurrency (**OA merge proof** § concurrency semantics); reproduction belongs ops playbook attach |

*(Warehouse cron scaffold defaults **off** — verify **`CronRunLedger`** **`skipped`** rows carry **`disabled_by_env`** when **`ENABLE_OPERATIONAL_ANALYTICS_WAREHOUSE_REFRESH_CRON` ≠ `true`**.)*

### Ops visibility helpers

| Surface | Example probe | Purpose |
|---------|---------------|---------|
| Cron ledger rollup | **`GET /api/v1/system/ops/summary`** | Warehouse cron tile + ledger grouping snapshot (**warehouse governance**) |
| Operational intelligence dashboard | **`GET /api/v1/admin/operational-intelligence/dashboard`** | **`warehouseOperationalFreshness`** staleness semantics literacy (**warehouse governance staleness table**) |

---

## Required admin verification

- [ ] Route existence parity per **`production-deployment-governance-v1.md` § Deploy verification item **2** (**401 vs 404 discipline** for auth surfaces).
- [ ] Cross-check **production web** targets API base URL verified above (**frontend/backend parity**).
- [ ] Spot **`/book`** load — network tab shows **no systematic 404** storm on newly merged paths (`production-deployment-governance-v1.md`).
- [ ] Compare API and web version endpoint `version.gitSha` values against the expected `origin/main` SHA. Healthy HTTP responses without matching version proof do **not** establish commit parity.
- [ ] If Railway dashboard commit evidence is used because runtime metadata failed, record it as an explicit exception with deployment ID, deployed commit SHA, timestamp, actor, environment, and follow-up to restore `/api/v1/system/version` proof.

---

## Required manual operational checks (non-code)

- [ ] **Stakeholder acknowledgment**: merge author + release/on-call confirms Railway SUCCESS timestamp matches expectation (**Ownership** section).
- [ ] **Evidence archive**: SHA → deployment ID → sampled HTTP status artifact stored per ops norms (**UNKNOWN methodology acceptable until tooling standardized — placeholder expectation only**).

---

## Cron verification rules

| Rule | Rationale |
|------|-----------|
| **`CronRunLedger`** **`skipped`** ≠ malfunction — confirm **`disabled_by_env`** metadata aligns **`ENABLE_RUNTIME_MATRIX_V2.md`** semantics | Silent skips historically masked automation posture (`completion census`) |
| Treat **`NODE_ENV=test`** CI skips **non-transferable** proof for prod toggles | Outbox cron explicitly gated |
| **Inverted billing cron semantics** — **`ENABLE_PAYMENT_*`** pattern differs — absence env snapshot misleading (`ENABLE_RUNTIME_MATRIX_V2.md`) |

---

## Forbidden assumptions

- **`main` green ⇒ prod updated** — STOP (`production-deployment-governance-v1.md`).
- **Railway dashboard SHA ⇒ runtime endpoint proof** — STOP unless recorded as an explicit exception; dashboard evidence is secondary to `/api/v1/system/version`.
- **Cron code merged ⇒ cron executes** — STOP (`ENABLE_RUNTIME_MATRIX_V2.md`).
- **Warehouse staleness ⇒ ops outage** — STOP (**warehouse staleness interpretation table**).
- **`grep` matrix ⇒ prod env truth** — STOP (`ENABLE_RUNTIME_MATRIX_V2.md` Authority §).

---

## Rollback triggers

Escalate per **`rollback-and-recovery-governance-v1.md`** when:

- Health/readiness fails sustained window post-deploy.
- Migration markers absent/partial contradictory Railway SUCCESS classification.
- Auth surfaces regress **404** parity unexpectedly despite SUCCESS deploy.

---

## Evidence capture requirements

Minimum bundle after verification windows:

1. Deploy SHA + Railway deployment ID + verifying actor identity.
2. Timestamped HTTP excerpt (**health/readiness** minimal JSON subset acceptable redacted).
3. Timestamped non-secret version excerpts from **`/api/v1/system/version`** and **`/api/version`**, including `service`, `version.gitSha`, `version.shortGitSha`, `version.buildTime`, and `version.source`.
4. Optional admin-route excerpt (**refresh-runs** header counts redacted) when OA lanes exercised intentionally.

---

## Related docs

- [`warehouse-refresh-scheduling-governance-v1.md`](./warehouse-refresh-scheduling-governance-v1.md)
- [`OA_REFRESH_GOVERNANCE_MERGE_PROOF_V1.md`](../audits/OA_REFRESH_GOVERNANCE_MERGE_PROOF_V1.md)

**STOP** — procedural checklist only — operator fills specifics.
