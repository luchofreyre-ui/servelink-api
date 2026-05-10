# Prisma production migration governance (v1)

How **Servelink API** applies and validates migrations against **staging/production** Postgres. Complements repo authoring rules in **`docs/engineering/prisma-migration-governance-v1.md`** (read that for creating/editing migrations in Git).

---

## Additive-first philosophy

- Prefer **nullable columns**, **new tables**, **new indexes**.
- Destructive steps (**DROP**, **NOT NULL** without backfill, narrowing types) require an **explicit expand → backfill → contract** plan across migrations/deploys—never “surprise contract” in prod.

---

## Immutable landed migrations

- Do **not** edit SQL or rename folders for migrations **already on `main`** / deployed.
- CI **`npm run check:migration-history`** enforces immutability against merge bases—see `.github/workflows/pr-ci.yml`.

---

## Migration lineage integrity

- **Canonical lineage:** ordered folders under `services/api/prisma/migrations` **as merged to `main`**.
- **Authoritative prod signal:** `DATABASE_URL=<target> npx prisma migrate status` on the **real database**, plus **runtime logs** from **`prisma migrate deploy`** on deploy.

---

## Local DB divergence (classification)

**Long-lived local dev databases are not authoritative lineage signals.**

If `migrate status` reports:

- migrations **pending** in repo but not applied locally, and/or  
- rows in `_prisma_migrations` **without** matching folders in repo,

that is **environment contamination** (wrong branch, old folders removed, manual applies)—**not** proof that `main` is broken.

**Correct response:** validate on **fresh Postgres** (CI does this every push) or disposable DB + full **`migrate deploy`** replay—see engineering doc §7–8.

---

## Staging / prod `migrate status`

Before trusting a production rollout:

- Run **`migrate status`** against **staging** (same lineage expectation as prod when shared pipeline).
- Run **`migrate status`** against **production** when investigating drift or post-incident—**read-only**, no `migrate resolve` without governance.

**Blocking condition:** If status reports **history divergence** (`different migrations`, missing local folders, etc.), **stop**—follow **`docs/engineering/prisma-migration-governance-v1.md`** §10 (emergency protocol) and **`docs/operations/rollback-and-recovery-governance-v1.md`**.

---

## Migrate-on-boot philosophy

- **Every API container start** runs **`npx prisma migrate deploy`** before Nest listens.
- **Pros:** Prod schema catches up automatically when deploy ships; failed migration **blocks** bad code from serving traffic.
- **Cons:** Bad migration **blocks boot**—treat failed deploy logs as **P1**.

---

## Deployment blocking conditions

Do **not** ship API deploys that rely on new columns/tables until:

1. Migration folders are **on `main`** with CI green (fresh DB replay passed).
2. **Prod/staging `migrate status`** is understood—no unresolved divergence.

*(Boot-time migrate will apply pending migrations; if divergence exists, deploy fails until ops resolves.)*

---

## Emergency drift protocol

- **No** manual prod DDL to “match” Prisma without engineer + ops agreement.
- **`migrate resolve`** and history repair only under **documented** drift analysis—see engineering governance §10.

---

## Rollback philosophy (additive migrations)

- **Code rollback** (redeploy previous image) leaves **new columns/tables** in place—usually safe if new code paths were additive.
- **Do not** assume down-migrations exist; Prisma doesn’t generate automatic downs.
- **Destructive rollback** (drop column) is a **forward migration** or emergency procedure with backup + plan.

---

## Related docs

- Authoring & CI replay: `docs/engineering/prisma-migration-governance-v1.md`
- Deploy verification: `docs/operations/production-deployment-governance-v1.md`
- Incidents: `docs/operations/rollback-and-recovery-governance-v1.md`
