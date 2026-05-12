-- Phase 23 — closed-loop operational outcome intelligence (additive observations only).

CREATE TABLE "WorkflowOutcomeEvaluation" (
    "id" TEXT NOT NULL,
    "outcomeEngineVersion" TEXT NOT NULL DEFAULT 'operational_outcome_phase23_v1',
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "workflowExecutionId" TEXT NOT NULL,
    "activationId" TEXT,
    "evaluationCategory" TEXT NOT NULL,
    "evaluationResult" TEXT NOT NULL,
    "effectivenessScore" INTEGER NOT NULL DEFAULT 0,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowOutcomeEvaluation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkflowOutcomeEvaluation_outcomeEngineVersion_aggregateWindow_createdAt_idx" ON "WorkflowOutcomeEvaluation"("outcomeEngineVersion", "aggregateWindow", "createdAt");

CREATE INDEX "WorkflowOutcomeEvaluation_workflowExecutionId_createdAt_idx" ON "WorkflowOutcomeEvaluation"("workflowExecutionId", "createdAt");

CREATE TABLE "SimulationAccuracySnapshot" (
    "id" TEXT NOT NULL,
    "outcomeEngineVersion" TEXT NOT NULL DEFAULT 'operational_outcome_phase23_v1',
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "workflowExecutionId" TEXT NOT NULL,
    "simulationScenarioId" TEXT NOT NULL,
    "accuracyCategory" TEXT NOT NULL,
    "predictedJson" JSONB NOT NULL DEFAULT '{}',
    "actualJson" JSONB NOT NULL DEFAULT '{}',
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SimulationAccuracySnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SimulationAccuracySnapshot_outcomeEngineVersion_aggregateWindow_createdAt_idx" ON "SimulationAccuracySnapshot"("outcomeEngineVersion", "aggregateWindow", "createdAt");

CREATE INDEX "SimulationAccuracySnapshot_workflowExecutionId_createdAt_idx" ON "SimulationAccuracySnapshot"("workflowExecutionId", "createdAt");

CREATE INDEX "SimulationAccuracySnapshot_simulationScenarioId_idx" ON "SimulationAccuracySnapshot"("simulationScenarioId");

CREATE TABLE "OperationalDriftSnapshot" (
    "id" TEXT NOT NULL,
    "outcomeEngineVersion" TEXT NOT NULL DEFAULT 'operational_outcome_phase23_v1',
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "driftCategory" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalDriftSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperationalDriftSnapshot_outcomeEngineVersion_aggregateWindow_createdAt_idx" ON "OperationalDriftSnapshot"("outcomeEngineVersion", "aggregateWindow", "createdAt");

CREATE INDEX "OperationalDriftSnapshot_driftCategory_severity_createdAt_idx" ON "OperationalDriftSnapshot"("driftCategory", "severity", "createdAt");
