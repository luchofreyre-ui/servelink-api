-- Phase 27 — cohort-normalized operational science + intervention observation sandboxes (additive; observe/compare only).

CREATE TABLE "OperationalCohortSnapshot" (
    "id" TEXT NOT NULL,
    "cohortEngineVersion" TEXT NOT NULL DEFAULT 'operational_cohort_phase27_v1',
    "cohortCategory" TEXT NOT NULL,
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalCohortSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperationalCohortSnapshot_cohortEngineVersion_aggregateWindow_createdAt_idx" ON "OperationalCohortSnapshot"("cohortEngineVersion", "aggregateWindow", "createdAt");

CREATE INDEX "OperationalCohortSnapshot_cohortCategory_idx" ON "OperationalCohortSnapshot"("cohortCategory");

CREATE TABLE "OperationalInterventionSandbox" (
    "id" TEXT NOT NULL,
    "sandboxEngineVersion" TEXT NOT NULL DEFAULT 'operational_intervention_sandbox_phase27_v1',
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "sandboxCategory" TEXT NOT NULL,
    "sandboxState" TEXT NOT NULL,
    "workflowExecutionId" TEXT NOT NULL,
    "activationId" TEXT,
    "idempotencyKey" TEXT,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "resultJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalInterventionSandbox_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OperationalInterventionSandbox_idempotencyKey_key" ON "OperationalInterventionSandbox"("idempotencyKey");

CREATE INDEX "OperationalInterventionSandbox_sandboxEngineVersion_aggregateWindow_createdAt_idx" ON "OperationalInterventionSandbox"("sandboxEngineVersion", "aggregateWindow", "createdAt");

CREATE INDEX "OperationalInterventionSandbox_workflowExecutionId_idx" ON "OperationalInterventionSandbox"("workflowExecutionId");

CREATE TABLE "InterventionEvaluationSnapshot" (
    "id" TEXT NOT NULL,
    "evaluationEngineVersion" TEXT NOT NULL DEFAULT 'intervention_evaluation_phase27_v1',
    "evaluationCategory" TEXT NOT NULL,
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "evaluationResult" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterventionEvaluationSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InterventionEvaluationSnapshot_evaluationEngineVersion_aggregateWindow_createdAt_idx" ON "InterventionEvaluationSnapshot"("evaluationEngineVersion", "aggregateWindow", "createdAt");

CREATE INDEX "InterventionEvaluationSnapshot_evaluationCategory_evaluationResult_idx" ON "InterventionEvaluationSnapshot"("evaluationCategory", "evaluationResult");
