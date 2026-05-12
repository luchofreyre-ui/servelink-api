-- Phase 24 — governed operational experimentation + benchmarking (additive; no autonomous optimization).

CREATE TABLE "WorkflowBenchmarkScenario" (
    "id" TEXT NOT NULL,
    "benchmarkEngineVersion" TEXT NOT NULL DEFAULT 'workflow_benchmark_phase24_v1',
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "benchmarkCategory" TEXT NOT NULL,
    "workflowExecutionId" TEXT NOT NULL,
    "simulationScenarioId" TEXT,
    "benchmarkState" TEXT NOT NULL DEFAULT 'completed',
    "idempotencyKey" TEXT,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "resultJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowBenchmarkScenario_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkflowBenchmarkScenario_idempotencyKey_key" ON "WorkflowBenchmarkScenario"("idempotencyKey");

CREATE INDEX "WorkflowBenchmarkScenario_benchmarkEngineVersion_aggregateWindow_createdAt_idx" ON "WorkflowBenchmarkScenario"("benchmarkEngineVersion", "aggregateWindow", "createdAt");

CREATE INDEX "WorkflowBenchmarkScenario_workflowExecutionId_createdAt_idx" ON "WorkflowBenchmarkScenario"("workflowExecutionId", "createdAt");

CREATE INDEX "WorkflowBenchmarkScenario_benchmarkCategory_idx" ON "WorkflowBenchmarkScenario"("benchmarkCategory");

CREATE TABLE "OperationalExperimentSnapshot" (
    "id" TEXT NOT NULL,
    "experimentEngineVersion" TEXT NOT NULL DEFAULT 'operational_experiment_phase24_v1',
    "experimentCategory" TEXT NOT NULL,
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "evaluationResult" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalExperimentSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperationalExperimentSnapshot_experimentEngineVersion_aggregateWindow_createdAt_idx" ON "OperationalExperimentSnapshot"("experimentEngineVersion", "aggregateWindow", "createdAt");

CREATE INDEX "OperationalExperimentSnapshot_experimentCategory_evaluationResult_idx" ON "OperationalExperimentSnapshot"("experimentCategory", "evaluationResult");
