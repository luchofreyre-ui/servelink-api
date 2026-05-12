-- Phase 21 — orchestration simulation + operational safety evaluation rows (additive; non-autonomous).

CREATE TABLE "WorkflowSimulationScenario" (
    "id" TEXT NOT NULL,
    "scenarioCategory" TEXT NOT NULL,
    "workflowExecutionId" TEXT NOT NULL,
    "activationId" TEXT,
    "simulationState" TEXT NOT NULL DEFAULT 'completed',
    "requestedByUserId" TEXT,
    "idempotencyKey" TEXT,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "resultJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowSimulationScenario_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkflowSimulationScenario_idempotencyKey_key" ON "WorkflowSimulationScenario"("idempotencyKey");

CREATE INDEX "WorkflowSimulationScenario_workflowExecutionId_createdAt_idx" ON "WorkflowSimulationScenario"("workflowExecutionId", "createdAt");

CREATE INDEX "WorkflowSimulationScenario_scenarioCategory_createdAt_idx" ON "WorkflowSimulationScenario"("scenarioCategory", "createdAt");

CREATE TABLE "OperationalSafetyEvaluation" (
    "id" TEXT NOT NULL,
    "workflowExecutionId" TEXT NOT NULL,
    "simulationScenarioId" TEXT,
    "evaluationCategory" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalSafetyEvaluation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperationalSafetyEvaluation_workflowExecutionId_createdAt_idx" ON "OperationalSafetyEvaluation"("workflowExecutionId", "createdAt");

CREATE INDEX "OperationalSafetyEvaluation_evaluationCategory_severity_createdAt_idx" ON "OperationalSafetyEvaluation"("evaluationCategory", "severity", "createdAt");

ALTER TABLE "WorkflowSimulationScenario" ADD CONSTRAINT "WorkflowSimulationScenario_workflowExecutionId_fkey" FOREIGN KEY ("workflowExecutionId") REFERENCES "WorkflowExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkflowSimulationScenario" ADD CONSTRAINT "WorkflowSimulationScenario_activationId_fkey" FOREIGN KEY ("activationId") REFERENCES "WorkflowExecutionActivation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OperationalSafetyEvaluation" ADD CONSTRAINT "OperationalSafetyEvaluation_workflowExecutionId_fkey" FOREIGN KEY ("workflowExecutionId") REFERENCES "WorkflowExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OperationalSafetyEvaluation" ADD CONSTRAINT "OperationalSafetyEvaluation_simulationScenarioId_fkey" FOREIGN KEY ("simulationScenarioId") REFERENCES "WorkflowSimulationScenario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
