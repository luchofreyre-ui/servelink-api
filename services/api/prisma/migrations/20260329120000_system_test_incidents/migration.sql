-- Phase 9: operator incidents above failure families

CREATE TABLE "SystemTestIncident" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "runId" TEXT NOT NULL,
    "incidentKey" TEXT NOT NULL,
    "incidentVersion" TEXT NOT NULL DEFAULT 'v1',
    "displayTitle" TEXT NOT NULL,
    "rootCauseCategory" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "firstSeenRunId" TEXT,
    "lastSeenRunId" TEXT,
    "affectedRunCount" INTEGER NOT NULL DEFAULT 0,
    "affectedFamilyCount" INTEGER NOT NULL DEFAULT 0,
    "affectedFileCount" INTEGER NOT NULL DEFAULT 0,
    "currentRunFamilyCount" INTEGER NOT NULL DEFAULT 0,
    "currentRunFailureCount" INTEGER NOT NULL DEFAULT 0,
    "leadFamilyId" TEXT,
    "metadataJson" JSONB,

    CONSTRAINT "SystemTestIncident_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SystemTestIncident_runId_incidentKey_key" ON "SystemTestIncident"("runId", "incidentKey");
CREATE INDEX "SystemTestIncident_severity_idx" ON "SystemTestIncident"("severity");
CREATE INDEX "SystemTestIncident_status_idx" ON "SystemTestIncident"("status");
CREATE INDEX "SystemTestIncident_updatedAt_idx" ON "SystemTestIncident"("updatedAt");
CREATE INDEX "SystemTestIncident_runId_idx" ON "SystemTestIncident"("runId");

CREATE TABLE "SystemTestIncidentFamilyMembership" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "incidentVersion" TEXT NOT NULL DEFAULT 'v1',
    "matchBasis" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemTestIncidentFamilyMembership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SystemTestIncidentFamilyMembership_incidentId_familyId_key" ON "SystemTestIncidentFamilyMembership"("incidentId", "familyId");
CREATE INDEX "SystemTestIncidentFamilyMembership_incidentId_idx" ON "SystemTestIncidentFamilyMembership"("incidentId");
CREATE INDEX "SystemTestIncidentFamilyMembership_familyId_idx" ON "SystemTestIncidentFamilyMembership"("familyId");

ALTER TABLE "SystemTestIncident" ADD CONSTRAINT "SystemTestIncident_runId_fkey" FOREIGN KEY ("runId") REFERENCES "SystemTestRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SystemTestIncident" ADD CONSTRAINT "SystemTestIncident_leadFamilyId_fkey" FOREIGN KEY ("leadFamilyId") REFERENCES "SystemTestFailureFamily"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SystemTestIncidentFamilyMembership" ADD CONSTRAINT "SystemTestIncidentFamilyMembership_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "SystemTestIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SystemTestIncidentFamilyMembership" ADD CONSTRAINT "SystemTestIncidentFamilyMembership_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "SystemTestFailureFamily"("id") ON DELETE CASCADE ON UPDATE CASCADE;
