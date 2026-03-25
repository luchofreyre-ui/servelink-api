-- CreateTable
CREATE TABLE "DeepCleanEstimatorIncidentFamily" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "totalIncidents" INTEGER NOT NULL DEFAULT 0,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeepCleanEstimatorIncidentFamily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeepCleanEstimatorIncidentFamily_fingerprint_key" ON "DeepCleanEstimatorIncidentFamily"("fingerprint");

-- CreateIndex
CREATE INDEX "DeepCleanEstimatorIncidentFamily_lastSeenAt_idx" ON "DeepCleanEstimatorIncidentFamily"("lastSeenAt");

-- CreateTable
CREATE TABLE "DeepCleanEstimatorIncidentFamilyStats" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "incidentCount" INTEGER NOT NULL,
    "reopenRate" DOUBLE PRECISION NOT NULL,
    "meanResolveHours" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeepCleanEstimatorIncidentFamilyStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeepCleanEstimatorIncidentFamilyStats_familyId_windowStart_idx" ON "DeepCleanEstimatorIncidentFamilyStats"("familyId", "windowStart");

-- AddForeignKey
ALTER TABLE "DeepCleanEstimatorIncidentFamilyStats" ADD CONSTRAINT "DeepCleanEstimatorIncidentFamilyStats_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "DeepCleanEstimatorIncidentFamily"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "DeepCleanEstimatorRollbackOutcome" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "rollbackVersionId" TEXT NOT NULL,
    "wasEffective" BOOLEAN,
    "evaluatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeepCleanEstimatorRollbackOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeepCleanEstimatorRollbackOutcome_incidentId_alertId_rollbackVersionId_key" ON "DeepCleanEstimatorRollbackOutcome"("incidentId", "alertId", "rollbackVersionId");

-- CreateIndex
CREATE INDEX "DeepCleanEstimatorRollbackOutcome_incidentId_idx" ON "DeepCleanEstimatorRollbackOutcome"("incidentId");

-- CreateTable
CREATE TABLE "DeepCleanEstimatorPolicyHealth" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "evaluationWindowStart" TIMESTAMP(3) NOT NULL,
    "evaluationWindowEnd" TIMESTAMP(3) NOT NULL,
    "triggerCount" INTEGER NOT NULL,
    "successCount" INTEGER NOT NULL,
    "failureCount" INTEGER NOT NULL,
    "staleCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeepCleanEstimatorPolicyHealth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeepCleanEstimatorPolicyHealth_policyId_evaluationWindowStart_idx" ON "DeepCleanEstimatorPolicyHealth"("policyId", "evaluationWindowStart");

-- CreateTable
CREATE TABLE "DeepCleanEstimatorReliabilityRecommendation" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "DeepCleanEstimatorReliabilityRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeepCleanEstimatorReliabilityRecommendation_type_createdAt_idx" ON "DeepCleanEstimatorReliabilityRecommendation"("type", "createdAt");
