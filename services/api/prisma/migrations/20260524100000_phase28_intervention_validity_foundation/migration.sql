-- Phase 28 — controlled intervention assignment labels + control/holdout summaries + validity certifications (additive; observe/classify/compare only).

CREATE TABLE "OperationalInterventionAssignment" (
    "id" TEXT NOT NULL,
    "assignmentEngineVersion" TEXT NOT NULL DEFAULT 'operational_intervention_assignment_phase28_v1',
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "assignmentCategory" TEXT NOT NULL,
    "cohortType" TEXT NOT NULL,
    "workflowExecutionId" TEXT NOT NULL,
    "activationId" TEXT,
    "assignmentState" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalInterventionAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OperationalInterventionAssignment_idempotencyKey_key" ON "OperationalInterventionAssignment"("idempotencyKey");

CREATE INDEX "OperationalInterventionAssignment_assignmentEngineVersion_aggregateWindow_createdAt_idx" ON "OperationalInterventionAssignment"("assignmentEngineVersion", "aggregateWindow", "createdAt");

CREATE INDEX "OperationalInterventionAssignment_cohortType_assignmentState_idx" ON "OperationalInterventionAssignment"("cohortType", "assignmentState");

CREATE INDEX "OperationalInterventionAssignment_workflowExecutionId_idx" ON "OperationalInterventionAssignment"("workflowExecutionId");

CREATE TABLE "OperationalValidityCertification" (
    "id" TEXT NOT NULL,
    "validityEngineVersion" TEXT NOT NULL DEFAULT 'operational_validity_cert_phase28_v1',
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "certificationCategory" TEXT NOT NULL,
    "certificationState" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalValidityCertification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperationalValidityCertification_validityEngineVersion_aggregateWindow_createdAt_idx" ON "OperationalValidityCertification"("validityEngineVersion", "aggregateWindow", "createdAt");

CREATE INDEX "OperationalValidityCertification_certificationCategory_certificationState_idx" ON "OperationalValidityCertification"("certificationCategory", "certificationState");

CREATE TABLE "ControlCohortSnapshot" (
    "id" TEXT NOT NULL,
    "controlCohortEngineVersion" TEXT NOT NULL DEFAULT 'control_cohort_phase28_v1',
    "cohortCategory" TEXT NOT NULL,
    "aggregateWindow" TEXT NOT NULL DEFAULT 'as_of_now',
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ControlCohortSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ControlCohortSnapshot_controlCohortEngineVersion_aggregateWindow_createdAt_idx" ON "ControlCohortSnapshot"("controlCohortEngineVersion", "aggregateWindow", "createdAt");

CREATE INDEX "ControlCohortSnapshot_cohortCategory_idx" ON "ControlCohortSnapshot"("cohortCategory");
