-- AlterEnum (run once per environment)
ALTER TYPE "SystemTestIncidentEventType" ADD VALUE 'validation_passed';
ALTER TYPE "SystemTestIncidentEventType" ADD VALUE 'validation_failed';
ALTER TYPE "SystemTestIncidentEventType" ADD VALUE 'reopened';
ALTER TYPE "SystemTestIncidentEventType" ADD VALUE 'incident_seen';

-- AlterTable
ALTER TABLE "SystemTestIncidentAction" ADD COLUMN IF NOT EXISTS "validationState" TEXT;
ALTER TABLE "SystemTestIncidentAction" ADD COLUMN IF NOT EXISTS "validationLastCheckedAt" TIMESTAMP(3);
ALTER TABLE "SystemTestIncidentAction" ADD COLUMN IF NOT EXISTS "validationLastPassedAt" TIMESTAMP(3);
ALTER TABLE "SystemTestIncidentAction" ADD COLUMN IF NOT EXISTS "validationLastFailedAt" TIMESTAMP(3);
ALTER TABLE "SystemTestIncidentAction" ADD COLUMN IF NOT EXISTS "reopenedAt" TIMESTAMP(3);
ALTER TABLE "SystemTestIncidentAction" ADD COLUMN IF NOT EXISTS "reopenCount" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "SystemTestIncidentAction_validationState_idx" ON "SystemTestIncidentAction"("validationState");
CREATE INDEX IF NOT EXISTS "SystemTestIncidentAction_reopenedAt_idx" ON "SystemTestIncidentAction"("reopenedAt");
