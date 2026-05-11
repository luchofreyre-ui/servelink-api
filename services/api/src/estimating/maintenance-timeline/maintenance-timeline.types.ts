import type { Prisma } from "@prisma/client";

export type MaintenanceCheckpointSubjectType = "customer" | "recurring_plan" | "booking";

export type MaintenanceCheckpointSourceKind =
  | "quote_snapshot"
  | "visit_completion"
  | "manual_admin"
  | "replay_job";

export type CheckpointProvenance = {
  replayApiVersion?: string;
  estimatorVersion?: string;
  bookingId?: string | null;
  recurringPlanId?: string | null;
  recurringOccurrenceId?: string | null;
  actorUserId?: string | null;
};

export type MaintenanceCheckpointCreatePayload = {
  subjectType: string;
  subjectId: string;
  customerId?: string | null;
  recurringPlanId?: string | null;
  bookingId?: string | null;
  recurringOccurrenceId?: string | null;
  effectiveAt: Date;
  sourceKind: string;
  schemaVersion: string;
  engineVersion: string;
  inputFingerprint: string;
  outputFingerprint: string;
  stateClassification: string;
  maintenanceScore: number;
  degradationPressure: number;
  retentionStrength: number;
  projectedRiskLevel: string | null;
  resetReviewPressure: string | null;
  payload: Prisma.InputJsonValue;
  provenance: Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined;
  supersedesCheckpointId?: string | null;
};
