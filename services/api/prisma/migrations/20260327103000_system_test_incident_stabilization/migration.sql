-- Stabilize system test incidents: per-run rows, stable incidentKey, index, snapshots, fix tracks.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'SystemTestIncidentFamilyMembership'
  ) THEN
    EXECUTE 'DELETE FROM "SystemTestIncidentFamilyMembership"';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'SystemTestIncident'
  ) THEN
    EXECUTE 'DELETE FROM "SystemTestIncident"';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'SystemTestIncident'
  ) THEN
    DROP INDEX IF EXISTS "SystemTestIncident_incidentKey_incidentVersion_key";
    DROP INDEX IF EXISTS "SystemTestIncidentFamilyMembership_familyId_incidentVersion_key";

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'SystemTestIncident'
        AND column_name = 'runId'
    ) THEN
      ALTER TABLE "SystemTestIncident" ADD COLUMN "runId" TEXT NOT NULL;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'SystemTestIncident_runId_fkey'
    ) THEN
      ALTER TABLE "SystemTestIncident" ADD CONSTRAINT "SystemTestIncident_runId_fkey" FOREIGN KEY ("runId") REFERENCES "SystemTestRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    CREATE UNIQUE INDEX IF NOT EXISTS "SystemTestIncident_runId_incidentKey_key" ON "SystemTestIncident"("runId", "incidentKey");
    CREATE INDEX IF NOT EXISTS "SystemTestIncident_runId_idx" ON "SystemTestIncident"("runId");
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'SystemTestIncidentFamilyMembership'
  ) THEN
    EXECUTE '
      CREATE UNIQUE INDEX IF NOT EXISTS "SystemTestIncidentFamilyMembership_incidentId_familyId_key"
      ON "SystemTestIncidentFamilyMembership"("incidentId", "familyId")
    ';
  END IF;
END $$;

CREATE TABLE "SystemTestIncidentIndex" (
    "id" TEXT NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "incidentKey" TEXT NOT NULL,
    "firstSeenRunId" TEXT,
    "lastSeenRunId" TEXT,
    "occurrenceCount" INTEGER NOT NULL DEFAULT 0,
    "lastSeenGapRuns" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SystemTestIncidentIndex_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SystemTestIncidentIndex_incidentKey_key" ON "SystemTestIncidentIndex"("incidentKey");
CREATE INDEX "SystemTestIncidentIndex_lastSeenRunId_idx" ON "SystemTestIncidentIndex"("lastSeenRunId");

CREATE TABLE "SystemTestIncidentSnapshot" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "incidentKey" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "familyIdsJson" JSONB NOT NULL,
    "summary" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "gapRunsBefore" INTEGER NOT NULL DEFAULT 0,
    "reappearedAfterGap" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SystemTestIncidentSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SystemTestIncidentSnapshot_incidentKey_runId_key" ON "SystemTestIncidentSnapshot"("incidentKey", "runId");
CREATE INDEX "SystemTestIncidentSnapshot_runId_idx" ON "SystemTestIncidentSnapshot"("runId");
CREATE INDEX "SystemTestIncidentSnapshot_incidentKey_idx" ON "SystemTestIncidentSnapshot"("incidentKey");

CREATE TABLE "SystemTestIncidentFixTrack" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "incidentKey" TEXT NOT NULL,
    "incidentVersion" TEXT NOT NULL DEFAULT 'v1',
    "primaryArea" TEXT NOT NULL,
    "recommendedStepsJson" JSONB NOT NULL,
    "validationStepsJson" JSONB NOT NULL,
    "representativeFilesJson" JSONB,
    "representativeFamilyKeysJson" JSONB,

    CONSTRAINT "SystemTestIncidentFixTrack_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SystemTestIncidentFixTrack_incidentKey_key" ON "SystemTestIncidentFixTrack"("incidentKey");
