-- OpsAlert (evidence) SLA work-queue partial indexes (ASC)
CREATE INDEX IF NOT EXISTS "OpsAlert_open_slaDueAt_asc_idx"
  ON "OpsAlert" ("slaDueAt" ASC)
  WHERE (status = 'open'::"OpsAlertStatus" AND "slaDueAt" IS NOT NULL);

CREATE INDEX IF NOT EXISTS "OpsAlert_open_unassigned_slaDueAt_asc_idx"
  ON "OpsAlert" ("slaDueAt" ASC)
  WHERE (status = 'open'::"OpsAlertStatus" AND "slaDueAt" IS NOT NULL AND "assignedToAdminId" IS NULL);

CREATE INDEX IF NOT EXISTS "OpsAlert_open_assignedToAdminId_slaDueAt_asc_idx"
  ON "OpsAlert" ("assignedToAdminId", "slaDueAt" ASC)
  WHERE (status = 'open'::"OpsAlertStatus" AND "slaDueAt" IS NOT NULL AND "assignedToAdminId" IS NOT NULL);

-- OpsAlertRollup SLA work-queue partial indexes (ASC)
CREATE INDEX IF NOT EXISTS "OpsAlertRollup_open_slaDueAt_asc_idx"
  ON "OpsAlertRollup" ("slaDueAt" ASC)
  WHERE (status = 'open'::"OpsAlertStatus" AND "slaDueAt" IS NOT NULL);

CREATE INDEX IF NOT EXISTS "OpsAlertRollup_open_unassigned_slaDueAt_asc_idx"
  ON "OpsAlertRollup" ("slaDueAt" ASC)
  WHERE (status = 'open'::"OpsAlertStatus" AND "slaDueAt" IS NOT NULL AND "assignedToAdminId" IS NULL);

CREATE INDEX IF NOT EXISTS "OpsAlertRollup_open_assignedToAdminId_slaDueAt_asc_idx"
  ON "OpsAlertRollup" ("assignedToAdminId", "slaDueAt" ASC)
  WHERE (status = 'open'::"OpsAlertStatus" AND "slaDueAt" IS NOT NULL AND "assignedToAdminId" IS NOT NULL);
