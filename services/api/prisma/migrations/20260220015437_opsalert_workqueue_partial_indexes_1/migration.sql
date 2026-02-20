/*
  Work-queue partial indexes (Prisma can't express these).

  Goal:
  - Speed up "unassigned open" and "mine open" inbox queries that sort by lastSeenAt desc
  - Avoid scanning lots of non-open rows when ordering by lastSeenAt
*/

-- OpsAlert (evidence table)

CREATE INDEX IF NOT EXISTS "OpsAlert_open_lastSeenAt_desc_idx"
ON "OpsAlert" ("lastSeenAt" DESC)
WHERE status = 'open';

CREATE INDEX IF NOT EXISTS "OpsAlert_open_unassigned_lastSeenAt_desc_idx"
ON "OpsAlert" ("lastSeenAt" DESC)
WHERE status = 'open' AND "assignedToAdminId" IS NULL;

CREATE INDEX IF NOT EXISTS "OpsAlert_open_assignedToAdminId_lastSeenAt_desc_idx"
ON "OpsAlert" ("assignedToAdminId", "lastSeenAt" DESC)
WHERE status = 'open' AND "assignedToAdminId" IS NOT NULL;

-- OpsAlertRollup (grouped table)

CREATE INDEX IF NOT EXISTS "OpsAlertRollup_open_lastSeenAt_desc_idx"
ON "OpsAlertRollup" ("lastSeenAt" DESC)
WHERE status = 'open';

CREATE INDEX IF NOT EXISTS "OpsAlertRollup_open_unassigned_lastSeenAt_desc_idx"
ON "OpsAlertRollup" ("lastSeenAt" DESC)
WHERE status = 'open' AND "assignedToAdminId" IS NULL;

CREATE INDEX IF NOT EXISTS "OpsAlertRollup_open_assignedToAdminId_lastSeenAt_desc_idx"
ON "OpsAlertRollup" ("assignedToAdminId", "lastSeenAt" DESC)
WHERE status = 'open' AND "assignedToAdminId" IS NOT NULL;
