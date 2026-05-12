-- Phase 31 — operational entity graph + chronology frames (additive; observe/connect only).

CREATE TABLE "OperationalEntityNode" (
    "id" TEXT NOT NULL,
    "graphEngineVersion" TEXT NOT NULL DEFAULT 'operational_entity_graph_phase31_v1',
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "idempotencyKey" TEXT,
    "entityCategory" TEXT NOT NULL,
    "entityState" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalEntityNode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OperationalEntityNode_idempotencyKey_key" ON "OperationalEntityNode"("idempotencyKey");

CREATE INDEX "OperationalEntityNode_graphEngineVersion_aggregateWindow_createdAt_idx" ON "OperationalEntityNode"("graphEngineVersion", "aggregateWindow", "createdAt");

CREATE INDEX "OperationalEntityNode_entityCategory_entityState_idx" ON "OperationalEntityNode"("entityCategory", "entityState");

CREATE TABLE "OperationalEntityEdge" (
    "id" TEXT NOT NULL,
    "graphEngineVersion" TEXT NOT NULL DEFAULT 'operational_entity_graph_phase31_v1',
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "sourceNodeId" TEXT NOT NULL,
    "targetNodeId" TEXT NOT NULL,
    "edgeCategory" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalEntityEdge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperationalEntityEdge_graphEngineVersion_aggregateWindow_createdAt_idx" ON "OperationalEntityEdge"("graphEngineVersion", "aggregateWindow", "createdAt");

CREATE INDEX "OperationalEntityEdge_sourceNodeId_idx" ON "OperationalEntityEdge"("sourceNodeId");

CREATE INDEX "OperationalEntityEdge_targetNodeId_idx" ON "OperationalEntityEdge"("targetNodeId");

CREATE INDEX "OperationalEntityEdge_edgeCategory_idx" ON "OperationalEntityEdge"("edgeCategory");

CREATE TABLE "OperationalChronologyFrame" (
    "id" TEXT NOT NULL,
    "graphEngineVersion" TEXT NOT NULL DEFAULT 'operational_entity_graph_phase31_v1',
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "chronologyCategory" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalChronologyFrame_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperationalChronologyFrame_graphEngineVersion_aggregateWindow_createdAt_idx" ON "OperationalChronologyFrame"("graphEngineVersion", "aggregateWindow", "createdAt");

CREATE INDEX "OperationalChronologyFrame_chronologyCategory_idx" ON "OperationalChronologyFrame"("chronologyCategory");

ALTER TABLE "OperationalEntityEdge" ADD CONSTRAINT "OperationalEntityEdge_sourceNodeId_fkey" FOREIGN KEY ("sourceNodeId") REFERENCES "OperationalEntityNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OperationalEntityEdge" ADD CONSTRAINT "OperationalEntityEdge_targetNodeId_fkey" FOREIGN KEY ("targetNodeId") REFERENCES "OperationalEntityNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
