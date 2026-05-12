-- Mega Phase A — operational replay intelligence suite (additive; deterministic observation only).

CREATE TABLE "OperationalReplayPairing" (
    "id" TEXT NOT NULL,
    "replaySuiteEngineVersion" TEXT NOT NULL DEFAULT 'operational_replay_intelligence_suite_mega_a_v1',
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "pairingCategory" TEXT NOT NULL,
    "orderedOlderReplaySessionId" TEXT NOT NULL,
    "orderedNewerReplaySessionId" TEXT NOT NULL,
    "operationalReplayDiffId" TEXT,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalReplayPairing_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OperationalReplayPairing_operationalReplayDiffId_key" ON "OperationalReplayPairing"("operationalReplayDiffId");

CREATE INDEX "OperationalReplayPairing_replaySuiteEngineVersion_aggregateWindow_createdAt_idx" ON "OperationalReplayPairing"("replaySuiteEngineVersion", "aggregateWindow", "createdAt");

CREATE INDEX "OperationalReplayPairing_pairingCategory_idx" ON "OperationalReplayPairing"("pairingCategory");

CREATE TABLE "OperationalChronologySemanticAlignment" (
    "id" TEXT NOT NULL,
    "replaySuiteEngineVersion" TEXT NOT NULL DEFAULT 'operational_replay_intelligence_suite_mega_a_v1',
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "operationalReplayDiffId" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalChronologySemanticAlignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OperationalChronologySemanticAlignment_operationalReplayDiffId_key" ON "OperationalChronologySemanticAlignment"("operationalReplayDiffId");

CREATE INDEX "OperationalChronologySemanticAlignment_replaySuiteEngineVersion_aggregateWindow_createdAt_idx" ON "OperationalChronologySemanticAlignment"("replaySuiteEngineVersion", "aggregateWindow", "createdAt");

CREATE TABLE "OperationalTopologySnapshot" (
    "id" TEXT NOT NULL,
    "replaySuiteEngineVersion" TEXT NOT NULL DEFAULT 'operational_replay_intelligence_suite_mega_a_v1',
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "replaySessionId" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalTopologySnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OperationalTopologySnapshot_replaySessionId_key" ON "OperationalTopologySnapshot"("replaySessionId");

CREATE INDEX "OperationalTopologySnapshot_replaySuiteEngineVersion_aggregateWindow_createdAt_idx" ON "OperationalTopologySnapshot"("replaySuiteEngineVersion", "aggregateWindow", "createdAt");

CREATE TABLE "OperationalReplayInterventionBridge" (
    "id" TEXT NOT NULL,
    "replaySuiteEngineVersion" TEXT NOT NULL DEFAULT 'operational_replay_intelligence_suite_mega_a_v1',
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "replaySessionId" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalReplayInterventionBridge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OperationalReplayInterventionBridge_replaySessionId_key" ON "OperationalReplayInterventionBridge"("replaySessionId");

CREATE INDEX "OperationalReplayInterventionBridge_replaySuiteEngineVersion_aggregateWindow_createdAt_idx" ON "OperationalReplayInterventionBridge"("replaySuiteEngineVersion", "aggregateWindow", "createdAt");

ALTER TABLE "OperationalReplayPairing" ADD CONSTRAINT "OperationalReplayPairing_orderedOlderReplaySessionId_fkey" FOREIGN KEY ("orderedOlderReplaySessionId") REFERENCES "OperationalReplaySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OperationalReplayPairing" ADD CONSTRAINT "OperationalReplayPairing_orderedNewerReplaySessionId_fkey" FOREIGN KEY ("orderedNewerReplaySessionId") REFERENCES "OperationalReplaySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OperationalReplayPairing" ADD CONSTRAINT "OperationalReplayPairing_operationalReplayDiffId_fkey" FOREIGN KEY ("operationalReplayDiffId") REFERENCES "OperationalReplayDiff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OperationalChronologySemanticAlignment" ADD CONSTRAINT "OperationalChronologySemanticAlignment_operationalReplayDiffId_fkey" FOREIGN KEY ("operationalReplayDiffId") REFERENCES "OperationalReplayDiff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OperationalTopologySnapshot" ADD CONSTRAINT "OperationalTopologySnapshot_replaySessionId_fkey" FOREIGN KEY ("replaySessionId") REFERENCES "OperationalReplaySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OperationalReplayInterventionBridge" ADD CONSTRAINT "OperationalReplayInterventionBridge_replaySessionId_fkey" FOREIGN KEY ("replaySessionId") REFERENCES "OperationalReplaySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
