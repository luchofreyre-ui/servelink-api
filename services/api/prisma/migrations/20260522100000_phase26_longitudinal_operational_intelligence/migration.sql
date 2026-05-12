-- Phase 26 — longitudinal operational intelligence + counterfactual-safe scaffolding (additive).

CREATE TABLE "OperationalExperimentLineage" (
    "id" TEXT NOT NULL,
    "longitudinalEngineVersion" TEXT NOT NULL DEFAULT 'operational_longitudinal_phase26_v1',
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "lineageCategory" TEXT NOT NULL,
    "sourceExperimentId" TEXT,
    "comparisonExperimentId" TEXT,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalExperimentLineage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperationalExperimentLineage_longitudinalEngineVersion_aggregateWindow_createdAt_idx" ON "OperationalExperimentLineage"("longitudinalEngineVersion", "aggregateWindow", "createdAt");

CREATE INDEX "OperationalExperimentLineage_lineageCategory_idx" ON "OperationalExperimentLineage"("lineageCategory");

CREATE TABLE "CounterfactualEvaluationSnapshot" (
    "id" TEXT NOT NULL,
    "longitudinalEngineVersion" TEXT NOT NULL DEFAULT 'operational_longitudinal_phase26_v1',
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "evaluationCategory" TEXT NOT NULL,
    "comparisonWindow" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CounterfactualEvaluationSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CounterfactualEvaluationSnapshot_longitudinalEngineVersion_aggregateWindow_createdAt_idx" ON "CounterfactualEvaluationSnapshot"("longitudinalEngineVersion", "aggregateWindow", "createdAt");

CREATE INDEX "CounterfactualEvaluationSnapshot_evaluationCategory_comparisonWindow_idx" ON "CounterfactualEvaluationSnapshot"("evaluationCategory", "comparisonWindow");

CREATE TABLE "OperationalReplayAlignment" (
    "id" TEXT NOT NULL,
    "longitudinalEngineVersion" TEXT NOT NULL DEFAULT 'operational_longitudinal_phase26_v1',
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "replayCategory" TEXT NOT NULL,
    "replayState" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalReplayAlignment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperationalReplayAlignment_longitudinalEngineVersion_aggregateWindow_createdAt_idx" ON "OperationalReplayAlignment"("longitudinalEngineVersion", "aggregateWindow", "createdAt");

CREATE INDEX "OperationalReplayAlignment_replayCategory_replayState_idx" ON "OperationalReplayAlignment"("replayCategory", "replayState");
