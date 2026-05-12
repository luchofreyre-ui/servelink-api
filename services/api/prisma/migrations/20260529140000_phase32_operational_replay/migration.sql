-- Phase 32 — operational replay + append-only graph history (additive; reconstruct/navigate only).

CREATE TABLE "OperationalGraphHistory" (
    "id" TEXT NOT NULL,
    "graphHistoryEngineVersion" TEXT NOT NULL DEFAULT 'operational_graph_history_phase32_v1',
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "historyCategory" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalGraphHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperationalGraphHistory_graphHistoryEngineVersion_aggregateWindow_createdAt_idx" ON "OperationalGraphHistory"("graphHistoryEngineVersion", "aggregateWindow", "createdAt");

CREATE INDEX "OperationalGraphHistory_historyCategory_idx" ON "OperationalGraphHistory"("historyCategory");

CREATE TABLE "OperationalReplaySession" (
    "id" TEXT NOT NULL,
    "replayEngineVersion" TEXT NOT NULL DEFAULT 'operational_replay_phase32_v1',
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "replayCategory" TEXT NOT NULL,
    "replayState" TEXT NOT NULL,
    "graphHistoryId" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalReplaySession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OperationalReplaySession_graphHistoryId_key" ON "OperationalReplaySession"("graphHistoryId");

CREATE INDEX "OperationalReplaySession_replayEngineVersion_aggregateWindow_createdAt_idx" ON "OperationalReplaySession"("replayEngineVersion", "aggregateWindow", "createdAt");

CREATE INDEX "OperationalReplaySession_replayCategory_replayState_idx" ON "OperationalReplaySession"("replayCategory", "replayState");

CREATE TABLE "OperationalReplayFrame" (
    "id" TEXT NOT NULL,
    "replayEngineVersion" TEXT NOT NULL DEFAULT 'operational_replay_phase32_v1',
    "replaySessionId" TEXT NOT NULL,
    "frameCategory" TEXT NOT NULL,
    "sequenceIndex" INTEGER NOT NULL,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalReplayFrame_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperationalReplayFrame_replayEngineVersion_replaySessionId_idx" ON "OperationalReplayFrame"("replayEngineVersion", "replaySessionId");

CREATE INDEX "OperationalReplayFrame_replaySessionId_sequenceIndex_idx" ON "OperationalReplayFrame"("replaySessionId", "sequenceIndex");

ALTER TABLE "OperationalReplaySession" ADD CONSTRAINT "OperationalReplaySession_graphHistoryId_fkey" FOREIGN KEY ("graphHistoryId") REFERENCES "OperationalGraphHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OperationalReplayFrame" ADD CONSTRAINT "OperationalReplayFrame_replaySessionId_fkey" FOREIGN KEY ("replaySessionId") REFERENCES "OperationalReplaySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
