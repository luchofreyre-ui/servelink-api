-- Phase 8: cross-run failure families + memberships
CREATE TABLE "SystemTestFailureFamily" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "familyKey" TEXT NOT NULL,
    "familyVersion" TEXT NOT NULL DEFAULT 'v1',
    "familyKind" TEXT NOT NULL DEFAULT 'layered_signature',
    "displayTitle" TEXT NOT NULL,
    "rootCauseSummary" TEXT NOT NULL,
    "primaryAssertionType" TEXT,
    "primaryLocator" TEXT,
    "primarySelector" TEXT,
    "primaryRouteUrl" TEXT,
    "primaryActionName" TEXT,
    "primaryErrorCode" TEXT,
    "firstSeenRunId" TEXT,
    "lastSeenRunId" TEXT,
    "totalOccurrencesAcrossRuns" INTEGER NOT NULL DEFAULT 0,
    "affectedRunCount" INTEGER NOT NULL DEFAULT 0,
    "affectedFileCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'quiet',
    "metadataJson" JSONB,

    CONSTRAINT "SystemTestFailureFamily_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SystemTestFailureFamily_familyKey_familyVersion_key" ON "SystemTestFailureFamily"("familyKey", "familyVersion");
CREATE INDEX "SystemTestFailureFamily_lastSeenRunId_idx" ON "SystemTestFailureFamily"("lastSeenRunId");
CREATE INDEX "SystemTestFailureFamily_status_idx" ON "SystemTestFailureFamily"("status");
CREATE INDEX "SystemTestFailureFamily_updatedAt_idx" ON "SystemTestFailureFamily"("updatedAt");

CREATE TABLE "SystemTestFailureFamilyMembership" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "familyVersion" TEXT NOT NULL DEFAULT 'v1',
    "runId" TEXT NOT NULL,
    "failureGroupId" TEXT NOT NULL,
    "canonicalKey" TEXT NOT NULL,
    "matchBasis" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemTestFailureFamilyMembership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SystemTestFailureFamilyMembership_failureGroupId_familyVersion_key" ON "SystemTestFailureFamilyMembership"("failureGroupId", "familyVersion");
CREATE INDEX "SystemTestFailureFamilyMembership_familyId_idx" ON "SystemTestFailureFamilyMembership"("familyId");
CREATE INDEX "SystemTestFailureFamilyMembership_runId_idx" ON "SystemTestFailureFamilyMembership"("runId");
CREATE INDEX "SystemTestFailureFamilyMembership_canonicalKey_idx" ON "SystemTestFailureFamilyMembership"("canonicalKey");

ALTER TABLE "SystemTestFailureFamilyMembership" ADD CONSTRAINT "SystemTestFailureFamilyMembership_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "SystemTestFailureFamily"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SystemTestFailureFamilyMembership" ADD CONSTRAINT "SystemTestFailureFamilyMembership_failureGroupId_fkey" FOREIGN KEY ("failureGroupId") REFERENCES "SystemTestFailureGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
