-- Phase 33 — deterministic replay diff / chronology delta / interpretation snapshots (additive).

CREATE TABLE "OperationalReplayDiff" (
    "id" TEXT NOT NULL,
    "replayAnalysisEngineVersion" TEXT NOT NULL DEFAULT 'operational_replay_analysis_phase33_v1',
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "diffCategory" TEXT NOT NULL,
    "sourceReplaySessionId" TEXT NOT NULL,
    "comparisonReplaySessionId" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalReplayDiff_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OperationalReplayDiff_sourceReplaySessionId_comparisonReplaySessionId_diffCategory_key" ON "OperationalReplayDiff"("sourceReplaySessionId", "comparisonReplaySessionId", "diffCategory");

CREATE INDEX "OperationalReplayDiff_replayAnalysisEngineVersion_aggregateWindow_createdAt_idx" ON "OperationalReplayDiff"("replayAnalysisEngineVersion", "aggregateWindow", "createdAt");

CREATE INDEX "OperationalReplayDiff_diffCategory_idx" ON "OperationalReplayDiff"("diffCategory");

CREATE TABLE "OperationalChronologyDelta" (
    "id" TEXT NOT NULL,
    "replayAnalysisEngineVersion" TEXT NOT NULL DEFAULT 'operational_replay_analysis_phase33_v1',
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "operationalReplayDiffId" TEXT NOT NULL,
    "deltaCategory" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalChronologyDelta_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperationalChronologyDelta_replayAnalysisEngineVersion_aggregateWindow_createdAt_idx" ON "OperationalChronologyDelta"("replayAnalysisEngineVersion", "aggregateWindow", "createdAt");

CREATE INDEX "OperationalChronologyDelta_operationalReplayDiffId_idx" ON "OperationalChronologyDelta"("operationalReplayDiffId");

CREATE TABLE "ReplayInterpretationSnapshot" (
    "id" TEXT NOT NULL,
    "replayAnalysisEngineVersion" TEXT NOT NULL DEFAULT 'operational_replay_analysis_phase33_v1',
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "operationalReplayDiffId" TEXT NOT NULL,
    "interpretationCategory" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReplayInterpretationSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReplayInterpretationSnapshot_operationalReplayDiffId_key" ON "ReplayInterpretationSnapshot"("operationalReplayDiffId");

CREATE INDEX "ReplayInterpretationSnapshot_replayAnalysisEngineVersion_aggregateWindow_createdAt_idx" ON "ReplayInterpretationSnapshot"("replayAnalysisEngineVersion", "aggregateWindow", "createdAt");

CREATE INDEX "ReplayInterpretationSnapshot_interpretationCategory_idx" ON "ReplayInterpretationSnapshot"("interpretationCategory");

ALTER TABLE "OperationalReplayDiff" ADD CONSTRAINT "OperationalReplayDiff_sourceReplaySessionId_fkey" FOREIGN KEY ("sourceReplaySessionId") REFERENCES "OperationalReplaySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OperationalReplayDiff" ADD CONSTRAINT "OperationalReplayDiff_comparisonReplaySessionId_fkey" FOREIGN KEY ("comparisonReplaySessionId") REFERENCES "OperationalReplaySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OperationalChronologyDelta" ADD CONSTRAINT "OperationalChronologyDelta_operationalReplayDiffId_fkey" FOREIGN KEY ("operationalReplayDiffId") REFERENCES "OperationalReplayDiff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReplayInterpretationSnapshot" ADD CONSTRAINT "ReplayInterpretationSnapshot_operationalReplayDiffId_fkey" FOREIGN KEY ("operationalReplayDiffId") REFERENCES "OperationalReplayDiff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
