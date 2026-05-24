# Railway CLI deploy hygiene (v1)

Operational rules for **`railway up`** / source uploads of **`servelink-api`** so experimental local files never leak into the Docker build.

Railway API production is expected to use the root **`Dockerfile`** with repo-root context unless Railway service settings explicitly point elsewhere. `services/api/Dockerfile` is kept aligned as a fallback/reference path.

---

## Canonical hazard

**`railway up` archives the working directory on disk (respecting `.gitignore`), not “only tracked Git files.”**

- **Untracked** files and directories that are **not** matched by `.gitignore` are included in the upload.
- The API image runs **`npm run build`** with **`tsc -p tsconfig.json`**, which compiles **`services/api/src/**/*.ts`**.
- Therefore **any untracked tree under `services/api/src/` can be compiled into the production image**.

**Observed failure mode:** untracked `services/api/src/modules/delivery/...` referenced **`nodemailer`**, which was not a declared dependency → **`TS2307: Cannot find module 'nodemailer'`** → Docker build failure.

---

## Hard stop before any Railway API deploy

0. From the **repository root**, run **`npm run check:railway-api-deploy-tree`**. It must **exit 0** immediately before **`railway up`**.
   - **Hard stops:** anything untracked under **`services/api/src`** or **`services/api/prisma`**, or **uncommitted changes** (vs `HEAD`) under those trees plus **`services/api/package.json`**, **`services/api/package-lock.json`**, **`package.json`**, **`package-lock.json`**.
   - **Metadata hard stops for CLI uploads:** local `HEAD` must match **`origin/main`**, and **`GIT_COMMIT_SHA`** or **`COMMIT_SHA`** must be injected into the API runtime environment with the exact `origin/main` SHA so `/api/v1/system/version` can prove the deployed commit at runtime.
   - **Warnings only:** **`apps/web`** untracked or modified paths — these **do not** fail the guard (API Docker build does not compile Next.js); treat them as separate web-deploy hygiene.
1. Run **`git status --short`** from the repo root for human-readable context.
2. **STOP** if **any** untracked (`??`) or unstaged/staged edits appear under:
   - **`services/api/src/`** — always deploy-critical for `tsc`.
   - **`services/api/prisma/`** — schema/migrations skew vs `main` can ship wrong DDL expectations.
   - **Root `package.json` / lockfiles** (and **`services/api/package.json`** / **`services/api/package-lock.json`**) — dependency drift vs `main`.
3. **STOP** if API runtime metadata cannot be proven:
   - GitHub-connected Railway deploys should use Railway-provided **`RAILWAY_GIT_COMMIT_SHA`**.
   - CLI/manual deploys must inject **`GIT_COMMIT_SHA`** or **`COMMIT_SHA`** equal to `origin/main` into the API runtime environment.
   - Docker builds should pass **`GIT_COMMIT_SHA`** and optional **`BUILD_TIME`** as build args where Railway supports them; the API build writes a generated metadata artifact as fallback when runtime env metadata is absent.
   - **`BUILD_TIME`** is recommended for ordering evidence, but it is not a substitute for SHA parity.

Resolve by **committing on a branch**, **`git stash`**, **`git clean`** (only when safe), or **moving experimental work outside the repo** (e.g. a dated quarantine folder on disk — **do not delete** uncommitted work).

---

## Experimental work placement

- Prefer **feature branches** and normal PR flow so CI is the gate.
- If code must stay **uncommitted**, keep it **outside** `~/Desktop/servelink` or in an explicit **quarantine directory** that is never uploaded.

---

## What “clean” means for API parity

- **`git reset --hard origin/main`** (when abandoning local commits is acceptable), **or**
- Working tree matches **`origin/main`** with **no** untracked deploy-risk paths under the directories above.

Tracked-only experimental code still belongs on a branch — **`main`** should not carry unmerged modules.

For CLI/manual uploads, clean tree alone is insufficient. The runtime proof contract requires `/api/v1/system/version` to return a non-`unknown` `version.gitSha` matching the deployed source SHA. Dashboard deployment commit evidence is secondary evidence, not a replacement, unless an explicit exception is recorded in the proof artifact.

---

## Related docs

- **`docs/operations/production-deployment-governance-v1.md`** — merged ≠ deployed, Railway expectations.
- **`DEPLOY_CLOSEOUT_CHECKLIST.md`** — launch verification checklist.
