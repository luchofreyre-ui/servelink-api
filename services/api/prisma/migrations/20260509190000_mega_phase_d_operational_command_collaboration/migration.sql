-- Mega Phase D — server-backed operational command collaboration (additive; human coordination only).

CREATE TABLE "OperationalCommandWorkspace" (
    "id" TEXT NOT NULL,
    "workspaceEngineVersion" TEXT NOT NULL DEFAULT 'collaborative_command_workspace_phase_d_v1',
    "ownerUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "handoffSummary" TEXT NOT NULL DEFAULT '',
    "bookmarks" JSONB NOT NULL DEFAULT '[]',
    "markers" JSONB NOT NULL DEFAULT '[]',
    "linkedReplaySessionId" TEXT,
    "linkedOlderReplaySessionId" TEXT,
    "linkedNewerReplaySessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalCommandWorkspace_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperationalCommandWorkspace_ownerUserId_updatedAt_idx" ON "OperationalCommandWorkspace"("ownerUserId", "updatedAt");

ALTER TABLE "OperationalCommandWorkspace" ADD CONSTRAINT "OperationalCommandWorkspace_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "OperationalCommandWorkspaceShare" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "sharedWithUserId" TEXT NOT NULL,
    "sharedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalCommandWorkspaceShare_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OperationalCommandWorkspaceShare_workspaceId_sharedWithUserId_key" ON "OperationalCommandWorkspaceShare"("workspaceId", "sharedWithUserId");

CREATE INDEX "OperationalCommandWorkspaceShare_sharedWithUserId_idx" ON "OperationalCommandWorkspaceShare"("sharedWithUserId");

ALTER TABLE "OperationalCommandWorkspaceShare" ADD CONSTRAINT "OperationalCommandWorkspaceShare_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "OperationalCommandWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OperationalCommandWorkspaceShare" ADD CONSTRAINT "OperationalCommandWorkspaceShare_sharedWithUserId_fkey" FOREIGN KEY ("sharedWithUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OperationalCommandWorkspaceShare" ADD CONSTRAINT "OperationalCommandWorkspaceShare_sharedByUserId_fkey" FOREIGN KEY ("sharedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "OperationalCommandWorkspaceTimelineEvent" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "eventKind" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalCommandWorkspaceTimelineEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperationalCommandWorkspaceTimelineEvent_workspaceId_createdAt_idx" ON "OperationalCommandWorkspaceTimelineEvent"("workspaceId", "createdAt");

ALTER TABLE "OperationalCommandWorkspaceTimelineEvent" ADD CONSTRAINT "OperationalCommandWorkspaceTimelineEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "OperationalCommandWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OperationalCommandWorkspaceTimelineEvent" ADD CONSTRAINT "OperationalCommandWorkspaceTimelineEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "OperationalReplayReviewSession" (
    "id" TEXT NOT NULL,
    "reviewEngineVersion" TEXT NOT NULL DEFAULT 'collaborative_replay_review_phase_d_v1',
    "createdByUserId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "title" TEXT NOT NULL,
    "investigationReviewState" TEXT NOT NULL DEFAULT 'open',
    "replaySessionIdPrimary" TEXT,
    "replaySessionIdCompare" TEXT,
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalReplayReviewSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperationalReplayReviewSession_createdByUserId_updatedAt_idx" ON "OperationalReplayReviewSession"("createdByUserId", "updatedAt");

CREATE INDEX "OperationalReplayReviewSession_workspaceId_idx" ON "OperationalReplayReviewSession"("workspaceId");

ALTER TABLE "OperationalReplayReviewSession" ADD CONSTRAINT "OperationalReplayReviewSession_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OperationalReplayReviewSession" ADD CONSTRAINT "OperationalReplayReviewSession_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "OperationalCommandWorkspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "OperationalReplayReviewComment" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "anchorKind" TEXT,
    "anchorPayloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalReplayReviewComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperationalReplayReviewComment_sessionId_createdAt_idx" ON "OperationalReplayReviewComment"("sessionId", "createdAt");

ALTER TABLE "OperationalReplayReviewComment" ADD CONSTRAINT "OperationalReplayReviewComment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "OperationalReplayReviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OperationalReplayReviewComment" ADD CONSTRAINT "OperationalReplayReviewComment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
