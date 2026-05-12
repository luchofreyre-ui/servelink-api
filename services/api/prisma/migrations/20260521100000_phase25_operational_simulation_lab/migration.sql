-- Phase 25 — operational simulation lab + associative attribution foundation (additive; no autonomy).

CREATE TABLE "OperationalSimulationLabRun" (
    "id" TEXT NOT NULL,
    "labEngineVersion" TEXT NOT NULL DEFAULT 'operational_sim_lab_phase25_v1',
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "simulationCategory" TEXT NOT NULL,
    "benchmarkScenarioId" TEXT,
    "simulationState" TEXT NOT NULL DEFAULT 'completed',
    "idempotencyKey" TEXT,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "resultJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalSimulationLabRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OperationalSimulationLabRun_idempotencyKey_key" ON "OperationalSimulationLabRun"("idempotencyKey");

CREATE INDEX "OperationalSimulationLabRun_labEngineVersion_aggregateWindow_createdAt_idx" ON "OperationalSimulationLabRun"("labEngineVersion", "aggregateWindow", "createdAt");

CREATE INDEX "OperationalSimulationLabRun_benchmarkScenarioId_idx" ON "OperationalSimulationLabRun"("benchmarkScenarioId");

CREATE INDEX "OperationalSimulationLabRun_simulationCategory_idx" ON "OperationalSimulationLabRun"("simulationCategory");

CREATE TABLE "ExperimentCertificationRecord" (
    "id" TEXT NOT NULL,
    "certificationEngineVersion" TEXT NOT NULL DEFAULT 'experiment_certification_phase25_v1',
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "experimentCategory" TEXT NOT NULL,
    "certificationState" TEXT NOT NULL,
    "evaluationSummary" TEXT NOT NULL DEFAULT '',
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperimentCertificationRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ExperimentCertificationRecord_certificationEngineVersion_aggregateWindow_createdAt_idx" ON "ExperimentCertificationRecord"("certificationEngineVersion", "aggregateWindow", "createdAt");

CREATE INDEX "ExperimentCertificationRecord_experimentCategory_certificationState_idx" ON "ExperimentCertificationRecord"("experimentCategory", "certificationState");

CREATE TABLE "CausalAttributionSnapshot" (
    "id" TEXT NOT NULL,
    "causalEngineVersion" TEXT NOT NULL DEFAULT 'causal_attribution_phase25_v1',
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "attributionCategory" TEXT NOT NULL,
    "attributionResult" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CausalAttributionSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CausalAttributionSnapshot_causalEngineVersion_aggregateWindow_createdAt_idx" ON "CausalAttributionSnapshot"("causalEngineVersion", "aggregateWindow", "createdAt");

CREATE INDEX "CausalAttributionSnapshot_attributionCategory_attributionResult_idx" ON "CausalAttributionSnapshot"("attributionCategory", "attributionResult");
