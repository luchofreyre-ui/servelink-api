# CI and merge governance (v1)

Merge discipline for **Servelink** so **`main`** stays shippable and deploy risk is visible.

---

## Required CI

- **`PR CI`** (`.github/workflows/pr-ci.yml`): API + web checks, **fresh Postgres**, **`prisma migrate deploy`**, **`migrate status`**, **`check:migration-history`**, build/start smoke as configured.
- **Branch protection:** **`main`** should require this workflow **green** before merge (configure in GitHub UI).

---

## PR split expectations

**Lane isolation:**

- **UX-only lane:** `apps/web` public surfaces, copy, layout—**no** `services/api` changes, **no** Prisma migrations.
- **API / migration lane:** orchestrators, admin APIs, **`prisma/migrations`**, deposit/booking behavior tied to server truth.

**When split PRs are required:**

- Mixed UX + API + migration in one branch **without** tight coupling—split so reviewers can ship UX without blocking on migration review (and vice versa).
- **Ordering:** merge **UX first** when instrumentation depends on stable copy/layout **or** when cherry-pick conflicts force stacked integration—then **API/migration** second **rebased onto updated `main`**.

*(Lesson: funnel milestone work stacked with UX; splitting `#130` then `#131` reduced merge/rebase risk.)*

---

## Migration PR review

- Any PR touching **`services/api/prisma/migrations`** or **schema** requires:
  - **Additive-first** check (see prisma prod governance).
  - **CI green** including fresh **`migrate deploy`**.
  - No edits to **landed** migration folders (immutable history).

---

## Validation before merge

- Author runs **local** `npm run typecheck` / tests as usual for touched packages.
- **Do not merge** with failing **`PR CI`** unless explicitly waived with documented reason (avoid).

---

## Merge sequencing rules

1. **Dependency order:** If PR B’s integration tests assume PR A on `main`, merge **A** then **B** (rebase B if needed).
2. **Migration order:** New migration folder timestamps must **sort after** latest on `main` at integration time—see engineering Prisma doc §2.
3. **Instrumentation after UX** when conflicts otherwise force manual resolution that drops UX presentation—prefer **merge UX first**, then **instrumentation rebased**.

---

## Production-risk classification (deploy-risk tags)

| Tier | Examples | Merge bar |
|------|-----------|-----------|
| **Low** | Copy, spacing, SEO-only | CI green; deploy web only when isolated |
| **Medium** | New UI calling existing APIs | CI green; verify API contract unchanged |
| **High** | New routes, auth, payments, migrations | CI green + explicit deploy plan + post-deploy parity checklist |

---

## Deploy-risk categorization reminder

- **`main` merge** ≠ prod deploy—see **`docs/operations/production-deployment-governance-v1.md`**.
- High-risk merges **trigger** a deploy verification step in the same release thread.

---

## Related docs

- Production deploy: `docs/operations/production-deployment-governance-v1.md`
- Prisma: `docs/operations/prisma-production-migration-governance-v1.md` + `docs/engineering/prisma-migration-governance-v1.md`
- Failures: `docs/operations/rollback-and-recovery-governance-v1.md`
