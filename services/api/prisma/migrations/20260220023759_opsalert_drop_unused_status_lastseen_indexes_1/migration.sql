-- Drop unused generic status + lastSeenAt indexes
-- Superseded by partial open_*_lastSeenAt_desc_idx work-queue indexes

DROP INDEX IF EXISTS "OpsAlert_status_lastSeenAt_idx";
DROP INDEX IF EXISTS "OpsAlertRollup_status_lastSeenAt_idx";
