# Production deployment governance (v1)

Operational rules for **Nu Standard / Servelink** production delivery. Anti-chaos, not bureaucracy.

---

## Canonical rule

**Merged ≠ deployed.**

- **`main` green on GitHub does not imply production is running that commit.**
- Treat **HTTP parity checks** and **Railway deployment history** as the truth for “what is live.”

*(Lesson: `main` advanced through merges while Railway production stayed on an older image until a manual CLI deploy—features existed in repo and CI but routes returned 404 in prod.)*

---

## Canonical production deploy path

1. **Source of truth:** `origin/main` at a **known SHA** (merge commits or squash merges as landed).
2. **Deploy artifact:** Must match that SHA—prefer **GitHub-connected Railway deploy** from `main`, or **`railway deployment up`** only from a **clean** local tree **`git reset --hard origin/main`** (no uncommitted changes).
3. **Never:** Deploy from a dirty working tree, unpushed branch, or “almost main.”

---

## Railway expectations

- **CLI uploads:** **`railway up` ships your working tree**, including **untracked** files outside `.gitignore`. See **`docs/operations/railway-deploy-hygiene-v1.md`** before any manual upload deploy.
- **Service:** `servelink-api` (production environment).
- **Build:** `services/api/Dockerfile` with monorepo context as configured in Railway.
- **Health:** Platform healthcheck uses **`/api/v1/system/readiness`** (see Railway service settings).
- **Runtime:** API runs **`prisma migrate deploy`** before Nest boot (`services/api/src/main.ts`). Boot fails loud if migrations fail—no silent partial start.

---

## GitHub `main` relationship

- **`main`** is the integration branch for production-bound code.
- **CI on push to `main`** (`PR CI` workflow) validates typecheck, tests, fresh-DB **`migrate deploy`**, and migration-history integrity—see `docs/operations/ci-and-merge-governance-v1.md`.

---

## Auto-deploy and Wait-for-CI policy

**Target state (recommended):**

- **GitHub repo linked** to the Railway API service.
- **Auto-deploy enabled** for branch **`main`**.
- **Wait for CI** enabled so Railway deploys only after GitHub Actions succeed on that push.

*(Reduces “stale-by-omission”: merges ship without anyone running CLI.)*

**Until auto-deploy is enabled:** whoever merges or releases **owns** triggering production deploy (`railway deployment up` from clean `main` or Railway **Deploy Latest Commit**).

---

## Deploy verification (mandatory)

Immediately after any production deploy:

1. **`GET https://<prod-api>/api/v1/health`** → **200**, **`db`: `ok`** (or documented equivalent).
2. **Route existence** for critical new surfaces—e.g. expect **400** validation or **204**, **not 404**, for new POST routes; **401** **not 404** for new admin GET routes when unauthenticated.
3. **Railway logs:** confirm **`=== MIGRATION COMPLETE ===`** and **`=== CONTINUING TO NEST BOOT ===`** on boot when schema changed.
4. **Frontend/backend parity:** production web must target the same API base URL that was verified above; spot-check **Nu Standard** `/book` loads and **network tab** shows no systematic **404** on new API paths.

---

## Parity and skew

- **Backend-only merge** without API deploy → web may call endpoints that **404** (instrumentation dead, admin panels empty).
- **Frontend-only merge** without web deploy → users never see UX fixes.
- After deploys touching **both**, verify **both** surfaces.

---

## Ownership

- **Merge author + on-call / release owner** confirm deploy completion when production is expected to move—don’t assume Railway fired.
- Document **who triggered deploy** in Railway deploy message when using CLI (`-m "deploy <sha> …"`).

---

## Related docs

- Warehouse refresh cadence (analytics snapshots): `docs/operations/warehouse-refresh-scheduling-governance-v1.md`
- Railway upload / untracked hygiene: `docs/operations/railway-deploy-hygiene-v1.md`
- Prisma prod behavior: `docs/operations/prisma-production-migration-governance-v1.md`
- CI merge gates: `docs/operations/ci-and-merge-governance-v1.md`
- Failure modes: `docs/operations/rollback-and-recovery-governance-v1.md`
