# Rollback and recovery governance (v1)

Deterministic responses when **deploys**, **migrations**, or **parity** fail—based on real failure modes observed in Servelink ops.

---

## Severity (operational)

| Level | Meaning |
|-------|---------|
| **S3** | Deploy delayed; no user-visible breakage confirmed |
| **S2** | User-visible degradation or missing features in prod |
| **S1** | Payments, booking completion, auth, or data integrity at risk |

---

## Deployment failure response

1. **Railway:** deployment **FAILED** or healthcheck never passes → capture **build + deploy logs**.
2. **Do not** repeatedly redeploy blindly—identify compile vs migrate vs runtime.
3. **Previous SUCCESS deployment** remains or rollback target—note deployment ID in Railway UI.

---

## Stale deployment detection (“stale-by-omission”)

**Symptoms:**

- GitHub **`main`** includes commits **days newer** than Railway **last SUCCESS** deploy timestamp.
- **`GET /health`** ok but **new Nest routes return 404** while sibling routes exist (e.g. `POST …/availability` works, **`POST …/funnel-milestone`** **404**).

**Actions:**

1. Confirm **`railway deployment list`** / dashboard **last deploy time** vs **`git log origin/main`**.
2. **Deploy current `main`** using canonical path—see **`production-deployment-governance-v1.md`**.
3. Post-deploy: **mandatory parity probes** (health, new routes non-404, logs show migrate complete).

*(Lesson: prod stayed on May 4 image while `main` moved to May 10 merges until CLI redeploy.)*

---

## Frontend / backend version skew

**Symptoms:**

- Browser bundle references API paths (**network** shows calls to e.g. **`…/funnel-milestone`**) but API returns **404**.
- Admin UI loads but **admin fetch** fails **404** on new resource.

**Interpretation:** **Web deployed ahead of API**, or web points at wrong **`NEXT_PUBLIC_*`** base URL.

**Actions:**

1. Verify **which API URL** production web uses.
2. Align **Railway API deploy** with **`main`** SHA expected by shipped web.
3. Re-run **post-deploy parity checks**.

---

## Migration failure response

**Symptoms:**

- Logs: **`=== MIGRATION FAILED ===`** or Prisma **divergence** / **P3009**-class messages on boot.
- API never reaches **`=== CONTINUING TO NEST BOOT ===`**.

**Actions:**

1. **Stop** further rolling deploys—fleet may be split if some replicas old (prefer single replica until clear).
2. **Capture full migrate output** from Railway logs—no manual prod DDL without protocol.
3. If **history divergence** confirmed on prod DB → **`stop and assess`**—follow **`docs/engineering/prisma-migration-governance-v1.md`** §10; **do not** `migrate resolve` casually.

---

## Migration divergence scenario

**Symptoms:** `migrate status` on prod/staging shows **migrations in DB not in repo** or **cannot reconcile**.

**Rule:** **Production migration reconciliation is not a solo improvisation.** Engineer + ops agreement + documented plan before fixes.

---

## Rollback triggers

- **S1** regression introduced by latest deploy.
- **Failed migration** blocking boot with no safe forward fix within SLA.
- **Explicit** product decision to revert release.

**Rollback action:** Redeploy **last known-good Railway deployment** (image/commit)—understand schema **forward-only** implications per **`prisma-production-migration-governance-v1.md`**.

---

## Observability during recovery

- **Railway:** deploy logs + runtime logs (`migration`, `Nest`, `ERROR`).
- **HTTP:** health + one representative **authenticated** and **public** smoke each.
- **GitHub:** confirm SHA being deployed matches **`origin/main`** expectation.

---

## Stop-and-assess conditions

Stop automation and gather humans when:

- **Prod migration divergence** suspected or confirmed.
- **Data loss** or **duplicate charge** risk.
- **Unknown** why prod ≠ `main` after deploy allegedly succeeded.

---

## Production/API parity recovery (checklist)

1. **`git fetch && git checkout main && git reset --hard origin/main`** (deploy machine).
2. **`railway deployment up`** with message **`deploy <sha> …`** **or** dashboard **Deploy Latest Commit** from **`main`**.
3. Logs: migration complete → Nest boot.
4. Curl/post-deploy probes from **`production-deployment-governance-v1.md`**.

---

## Related docs

- `docs/operations/production-deployment-governance-v1.md`
- `docs/operations/prisma-production-migration-governance-v1.md`
- `docs/operations/ci-and-merge-governance-v1.md`
- `docs/engineering/prisma-migration-governance-v1.md`
