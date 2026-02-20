-- Drop redundant "generic" lastSeen work-queue indexes.
-- We replaced these with partial DESC work-queue indexes:
--   *_open_lastSeenAt_desc_idx
--   *_open_unassigned_lastSeenAt_desc_idx
--   *_open_assignedToAdminId_lastSeenAt_desc_idx

DROP INDEX IF EXISTS "OpsAlert_lastSeenAt_idx";
DROP INDEX IF EXISTS "OpsAlert_assignedToAdminId_status_lastSeenAt_idx";

DROP INDEX IF EXISTS "OpsAlertRollup_lastSeenAt_idx";
DROP INDEX IF EXISTS "OpsAlertRollup_assignedToAdminId_status_lastSeenAt_idx";
