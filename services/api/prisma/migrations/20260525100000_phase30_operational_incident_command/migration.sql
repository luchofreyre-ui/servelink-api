-- Phase 30 — operational incident coordination + drilldown link graph (additive; observe/coordinate only).

CREATE TABLE "OperationalIncident" (
    "id" TEXT NOT NULL,
    "incidentEngineVersion" TEXT NOT NULL DEFAULT 'operational_incident_phase30_v1',
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "idempotencyKey" TEXT,
    "incidentCategory" TEXT NOT NULL,
    "incidentState" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalIncident_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OperationalIncident_idempotencyKey_key" ON "OperationalIncident"("idempotencyKey");

CREATE INDEX "OperationalIncident_incidentEngineVersion_aggregateWindow_createdAt_idx" ON "OperationalIncident"("incidentEngineVersion", "aggregateWindow", "createdAt");

CREATE INDEX "OperationalIncident_incidentCategory_incidentState_idx" ON "OperationalIncident"("incidentCategory", "incidentState");

CREATE TABLE "OperationalIncidentLink" (
    "id" TEXT NOT NULL,
    "incidentEngineVersion" TEXT NOT NULL DEFAULT 'operational_incident_phase30_v1',
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "incidentId" TEXT NOT NULL,
    "linkedObjectType" TEXT NOT NULL,
    "linkedObjectId" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalIncidentLink_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperationalIncidentLink_incidentEngineVersion_aggregateWindow_createdAt_idx" ON "OperationalIncidentLink"("incidentEngineVersion", "aggregateWindow", "createdAt");

CREATE INDEX "OperationalIncidentLink_incidentId_idx" ON "OperationalIncidentLink"("incidentId");

CREATE INDEX "OperationalIncidentLink_linkedObjectType_linkedObjectId_idx" ON "OperationalIncidentLink"("linkedObjectType", "linkedObjectId");

CREATE TABLE "OperationalInvestigationTrail" (
    "id" TEXT NOT NULL,
    "incidentEngineVersion" TEXT NOT NULL DEFAULT 'operational_incident_phase30_v1',
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "incidentId" TEXT NOT NULL,
    "trailCategory" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalInvestigationTrail_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperationalInvestigationTrail_incidentEngineVersion_aggregateWindow_createdAt_idx" ON "OperationalInvestigationTrail"("incidentEngineVersion", "aggregateWindow", "createdAt");

CREATE INDEX "OperationalInvestigationTrail_incidentId_idx" ON "OperationalInvestigationTrail"("incidentId");

ALTER TABLE "OperationalIncidentLink" ADD CONSTRAINT "OperationalIncidentLink_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "OperationalIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OperationalInvestigationTrail" ADD CONSTRAINT "OperationalInvestigationTrail_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "OperationalIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
