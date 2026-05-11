-- Append-only maintenance timeline checkpoints (admin / calibration V1).

CREATE TABLE "MaintenanceStateCheckpoint" (
    "id" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "customerId" TEXT,
    "recurringPlanId" TEXT,
    "bookingId" TEXT,
    "recurringOccurrenceId" TEXT,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "sourceKind" TEXT NOT NULL,
    "schemaVersion" TEXT NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "inputFingerprint" TEXT NOT NULL,
    "outputFingerprint" TEXT NOT NULL,
    "stateClassification" TEXT NOT NULL,
    "maintenanceScore" INTEGER NOT NULL,
    "degradationPressure" INTEGER NOT NULL,
    "retentionStrength" INTEGER NOT NULL,
    "projectedRiskLevel" TEXT,
    "resetReviewPressure" TEXT,
    "payload" JSONB NOT NULL,
    "provenance" JSONB,
    "supersedesCheckpointId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceStateCheckpoint_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MaintenanceStateCheckpoint_idempotency_uq" ON "MaintenanceStateCheckpoint"("subjectType", "subjectId", "sourceKind", "inputFingerprint");

CREATE INDEX "MaintenanceStateCheckpoint_subjectType_subjectId_effectiveAt_idx" ON "MaintenanceStateCheckpoint"("subjectType", "subjectId", "effectiveAt");

CREATE INDEX "MaintenanceStateCheckpoint_customerId_effectiveAt_idx" ON "MaintenanceStateCheckpoint"("customerId", "effectiveAt");

CREATE INDEX "MaintenanceStateCheckpoint_recurringPlanId_effectiveAt_idx" ON "MaintenanceStateCheckpoint"("recurringPlanId", "effectiveAt");

CREATE INDEX "MaintenanceStateCheckpoint_bookingId_idx" ON "MaintenanceStateCheckpoint"("bookingId");

CREATE INDEX "MaintenanceStateCheckpoint_inputFingerprint_idx" ON "MaintenanceStateCheckpoint"("inputFingerprint");

CREATE INDEX "MaintenanceStateCheckpoint_schemaVersion_engineVersion_idx" ON "MaintenanceStateCheckpoint"("schemaVersion", "engineVersion");
