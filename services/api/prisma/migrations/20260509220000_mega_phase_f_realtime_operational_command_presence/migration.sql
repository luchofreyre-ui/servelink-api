-- Mega Phase F: collaborative operational presence + graph annotations (human-authored only).

CREATE TABLE "OperationalOperatorPresence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "surface" TEXT NOT NULL,
    "workspaceId" TEXT,
    "replayReviewSessionId" TEXT,
    "graphSelectedNodeId" TEXT,
    "replayChronologyFrameId" TEXT,
    "warRoomActive" BOOLEAN NOT NULL DEFAULT false,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalOperatorPresence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OperationalOperatorPresence_userId_key" ON "OperationalOperatorPresence"("userId");

CREATE INDEX "OperationalOperatorPresence_workspaceId_idx" ON "OperationalOperatorPresence"("workspaceId");

CREATE INDEX "OperationalOperatorPresence_replayReviewSessionId_idx" ON "OperationalOperatorPresence"("replayReviewSessionId");

CREATE INDEX "OperationalOperatorPresence_updatedAt_idx" ON "OperationalOperatorPresence"("updatedAt");

ALTER TABLE "OperationalOperatorPresence" ADD CONSTRAINT "OperationalOperatorPresence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "OperationalGraphCollaborationAnnotation" (
    "id" TEXT NOT NULL,
    "graphEngineVersion" TEXT NOT NULL DEFAULT 'operational_graph_collaboration_phase_f_v1',
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "graphNodeId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalGraphCollaborationAnnotation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperationalGraphCollaborationAnnotation_graphNodeId_createdAt_idx" ON "OperationalGraphCollaborationAnnotation"("graphNodeId", "createdAt");

ALTER TABLE "OperationalGraphCollaborationAnnotation" ADD CONSTRAINT "OperationalGraphCollaborationAnnotation_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
