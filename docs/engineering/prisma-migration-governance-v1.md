# Prisma migration governance (v1)

Canonical operational policy for `services/api/prisma/migrations` and schema rollout.  
Goal: **enforceable discipline** without heavy orchestration platforms.

---

## 1. Migration creation rules

- **One concern per migration folder**: prefer a single logical change; avoid unrelated edits in the same folder.
- **New folder only for new work**: add a new timestamped directory via Prisma (`prisma migrate dev`) or an approved manual folder that matches team conventions. Never “fold” multiple unrelated releases into one folder retroactively.
- **Name ordering is ordering**: Prisma applies migrations by folder name. Timestamps must sort correctly relative to existing folders on the integration branch (usually `main`).
- **Commit migrations with the code** that depends on them in the same PR when possible, so CI replays the same lineage developers used.

---

## 2. Rebase rules

- When rebasing a feature branch onto a newer `main`, if **`main` gained new migrations** after your branch was created:
  - Ensure your new migration folders still **sort after** the latest migration on `main`.
  - If your timestamps would now sort **before** migrations that already landed, **rename your migration folder** to a new timestamp **after** the latest on `main` (and fix any local `_prisma_migrations` state on disposable DBs only).
- **Never** change the timestamp or contents of migrations that already exist on `main` just to resolve rebase conflicts—**add a new migration** if schema needs adjustment.

---

## 3. Timestamp conflict handling

- Duplicate or colliding prefixes can occur in any repo with parallel work. The **filesystem order** Prisma uses is the source of truth for apply order.
- If two branches introduce different folders with conflicting ordering expectations, **integration fixes ordering on the branch that has not merged yet** (newer timestamp), not by editing merged history.
- After resolving, run **clean-room replay** (fresh database + `prisma migrate deploy`) before merge.

---

## 4. Never-edit-history policy

- **Do not** modify SQL, `migration.sql`, or supporting files inside migration folders that are **already merged to `main`** (or otherwise “landed” in production lineage).
- **Do not** delete or rename landed migration folders.
- **Do not** squash or rewrite Git history in a way that changes the tree contents of landed migrations.
- CI enforces immutability of paths that existed at the merge base (see `npm run check:migration-history` in `services/api`).

---

## 5. Additive-first schema philosophy

- Prefer **nullable columns**, **new tables**, and **new indexes** over destructive changes.
- Breaking changes (drops, type narrowing, NOT NULL without backfill) require an **explicit rollout plan**: expand → backfill → contract, often across **multiple** migrations and deploys.
- Destructive SQL in new migrations is allowed only with **reviewer sign-off** and a documented ops path; avoid automated destructive rollout without human gates.

---

## 6. Production rollout sequencing

Correct high-level order:

1. **`prisma migrate deploy`** (or equivalent) against the target database so schema matches the migration set in the release artifact.
2. **`prisma generate`** (usually in build/pipeline) so the runtime uses a client consistent with that schema.
3. **Runtime rollout** (containers / workers) that assume the new schema.

**Anti-pattern:** shipping application code that **reads/writes** columns or enums that do not yet exist in the database. That causes production errors that look like “random” API failures.

**Operational warning:** If deploy order is wrong, symptoms include Prisma errors (`column does not exist`), failed writes, or partial deploys across instances. **Mitigation:** run migrate first, verify `prisma migrate status` on the target DB, then roll containers. For zero-downtime, favor additive schema + backward-compatible code paths until the fleet is updated.

---

## 7. Clean-room replay certification

Before merge (or when doubting local state):

1. Use a **disposable PostgreSQL** instance (container or temp cluster) and an **empty** database.
2. From `services/api`:  
   `DATABASE_URL=... npx prisma migrate deploy`  
   then `npx prisma generate`, then `npx prisma migrate status` (must be up to date).
3. If replay fails, **do not** “fix” production or shared dev by `migrate resolve` without investigation; fix the **repo** migration set or your environment.

CI runs an equivalent check on every PR (see `.github/workflows/pr-ci.yml`).

---

## 8. Local contaminated DB policy

- Long-lived local databases often accumulate `_prisma_migrations` rows that **do not match** the repo (removed folders, manual edits, old branches). That is **environment contamination**, not proof the repo is corrupt.
- **Do not** use contaminated DBs to judge whether a branch is safe to merge.
- **Preferred:** use a **fresh database** for certification; keep the polluted database only if you knowingly use `migrate resolve` under the emergency protocol below.
- **Do not** edit historical migration files to “match” a dirty database.

---

## 9. Forbidden actions

- Editing **landed** `migration.sql` (or any file tracked under an existing migration folder on `main`) to “fix” history.
- Deleting migration folders that were already deployed.
- **`migrate resolve`** to paper over unknown drift **without** an audit trail and understanding of divergence (see §10).
- Running application deploy **before** `migrate deploy` when the release introduces schema dependencies.
- **`prisma db push`** against production or shared staging **as a substitute** for migration discipline (unless explicitly allowed by a separate, documented exception).

---

## 10. Emergency recovery protocol

Use only when ops and engineering agree there is **documented** drift between a database and the repo.

1. **Stop** further manual SQL “fixes” without tickets; capture current `_prisma_migrations` and schema diff.
2. Determine whether drift is **local-only** (replay on fresh DB is green) vs **production** mismatch.
3. **Production:** prefer **forward fix**: add a **new** migration that brings schema in line with the intended model; avoid rewriting history already applied in prod.
4. **`migrate resolve`:** only after identifying each migration name and whether it was **applied or rolled back** in reality; record actions in the incident ticket.
5. Re-run **clean-room replay** and CI migration gates before closing the incident.

---

## Safe local workflow (summary)

| Situation | Action |
|-----------|--------|
| `migrate status` shows drift vs repo | Prefer **fresh DB** replay; read §8. |
| Branch behind `main` and migration ordering broke | Rebase; **rename** your new folder to sort after `main` (§2). |
| Temptation to edit old `migration.sql` | **Stop**; add a new migration (§4–§5). |
| Unsure if CI will pass | Run `npm run check:migration-history` and clean-room replay (§7). |

**Untracked migration folders:** `check:migration-history` compares Git trees; **commit or stage** migrations before relying on CI parity.

**When NOT to use `migrate resolve`:** when you have not determined **why** the DB diverged (§9). It is not a general-purpose “make status green” tool.

---

## Enforcement in this repository

| Mechanism | What it covers |
|-----------|----------------|
| `npm run check:migration-history` | Immutability of files under `prisma/migrations` present at merge base / parent push. |
| PR CI | Fresh Postgres + `prisma generate`, `migrate deploy`, `migrate status`, plus **`npm run check:migration-history`** (immutable landed migration files). |

This is **lightweight governance**: it does not replace code review, additive design, or production runbooks.
