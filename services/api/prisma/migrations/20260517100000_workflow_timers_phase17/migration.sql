-- Phase 17 — workflow timers + wait-state substrate (additive; governed observe/wake only).

CREATE TABLE "WorkflowWaitState" (
    "id" TEXT NOT NULL,
    "workflowExecutionId" TEXT NOT NULL,
    "waitCategory" TEXT NOT NULL,
    "waitState" TEXT NOT NULL DEFAULT 'active',
    "waitingOn" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowWaitState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkflowWaitState_workflowExecutionId_waitingOn_key"
ON "WorkflowWaitState"("workflowExecutionId", "waitingOn");

CREATE INDEX "WorkflowWaitState_workflowExecutionId_waitState_idx"
ON "WorkflowWaitState"("workflowExecutionId", "waitState");

ALTER TABLE "WorkflowWaitState"
ADD CONSTRAINT "WorkflowWaitState_workflowExecutionId_fkey"
FOREIGN KEY ("workflowExecutionId") REFERENCES "WorkflowExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "WorkflowTimer" (
    "id" TEXT NOT NULL,
    "workflowExecutionId" TEXT NOT NULL,
    "timerType" TEXT NOT NULL,
    "timerState" TEXT NOT NULL DEFAULT 'pending',
    "wakeAt" TIMESTAMP(3) NOT NULL,
    "triggeredAt" TIMESTAMP(3),
    "dedupeKey" TEXT NOT NULL,
    "payloadJson" JSONB,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowTimer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkflowTimer_workflowExecutionId_dedupeKey_key"
ON "WorkflowTimer"("workflowExecutionId", "dedupeKey");

CREATE INDEX "WorkflowTimer_timerState_wakeAt_idx"
ON "WorkflowTimer"("timerState", "wakeAt");

ALTER TABLE "WorkflowTimer"
ADD CONSTRAINT "WorkflowTimer_workflowExecutionId_fkey"
FOREIGN KEY ("workflowExecutionId") REFERENCES "WorkflowExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
