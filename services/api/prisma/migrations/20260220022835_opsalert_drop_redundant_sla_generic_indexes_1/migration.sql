-- Drop redundant generic SLA indexes (superseded by partial work-queue SLA indexes)

DROP INDEX IF EXISTS "OpsAlert_status_slaDueAt_idx";
DROP INDEX IF EXISTS "OpsAlertRollup_status_slaDueAt_idx";
