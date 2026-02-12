# Prisma Workflow (Servelink API)

## Source of truth
- **Schema + migrations are the source of truth.**
- The database should always be at the repo migration head.

## Day-to-day changes (schema-first)
When you need a DB change:
1) Edit `prisma/schema.prisma`
2) Generate a migration:
   - `npx prisma migrate dev --name <short_description>`
3) Regenerate client:
   - `npx prisma generate`
4) Run tests:
   - `npm test`

## What NOT to do
- Do **not** manually change tables in Postgres.
- Do **not** routinely run `npx prisma db pull`.

## Emergency recovery only (db-first)
If schema is corrupted or DB was changed externally and you must recover:
1) `npx prisma db pull`
2) `npx prisma generate`
3) Immediately reconcile by creating a proper migration or reverting the DB to match repo.
4) Run:
   - `npx prisma validate`
   - `npx prisma migrate status`
   - `npm test`

## Quality gates (must stay green)
- `npx prisma validate`
- `npx prisma migrate status`
- `npm test`
- SMS smoke test: `./scripts/smoke_sms_addon.sh`
