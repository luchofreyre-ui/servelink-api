import { BadRequestException } from "@nestjs/common";
import type { MaintenanceCheckpointSourceKind } from "../../../estimating/maintenance-timeline/maintenance-timeline.types";

const REPLAY_SOURCE_KINDS = new Set<string>([
  "quote_snapshot",
  "manual_admin",
  "replay_job",
]);

export type ParsedMaintenanceReplayBody = {
  bookingId?: string;
  snapshotOutputJson?: string;
  snapshotInputJson?: string;
  evolutionInput?: Record<string, unknown>;
  persistCheckpoint: boolean;
  sourceKind?: string;
  effectiveAt?: string;
  subjectType?: string;
  subjectId?: string;
  customerId?: string;
  recurringPlanId?: string;
  recurringOccurrenceId?: string;
  evaluationAnchor?: string;
};

export function parseMaintenanceReplayDto(body: unknown): ParsedMaintenanceReplayBody {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new BadRequestException("MAINTENANCE_REPLAY_BODY_INVALID");
  }
  const raw = body as Record<string, unknown>;

  const bookingId =
    typeof raw.bookingId === "string" ? raw.bookingId.trim() : undefined;
  const snapshotOutputJson =
    typeof raw.snapshotOutputJson === "string"
      ? raw.snapshotOutputJson.trim()
      : undefined;
  const snapshotInputJson =
    typeof raw.snapshotInputJson === "string"
      ? raw.snapshotInputJson.trim()
      : undefined;

  const evolutionInputRaw = raw.evolutionInput;
  const evolutionInput =
    evolutionInputRaw != null &&
    typeof evolutionInputRaw === "object" &&
    !Array.isArray(evolutionInputRaw)
      ? (evolutionInputRaw as Record<string, unknown>)
      : undefined;

  const modes = [
    Boolean(bookingId),
    Boolean(snapshotOutputJson),
    Boolean(evolutionInput),
  ].filter(Boolean);
  if (modes.length !== 1) {
    throw new BadRequestException("MAINTENANCE_REPLAY_INPUT_AMBIGUOUS");
  }

  const persistCheckpoint = raw.persistCheckpoint === true;

  const sourceKind =
    typeof raw.sourceKind === "string" ? raw.sourceKind.trim() : undefined;
  if (sourceKind && !REPLAY_SOURCE_KINDS.has(sourceKind)) {
    throw new BadRequestException("MAINTENANCE_REPLAY_SOURCE_KIND_INVALID");
  }

  const effectiveAt =
    typeof raw.effectiveAt === "string" ? raw.effectiveAt.trim() : undefined;
  const subjectType =
    typeof raw.subjectType === "string" ? raw.subjectType.trim() : undefined;
  const subjectId =
    typeof raw.subjectId === "string" ? raw.subjectId.trim() : undefined;
  const customerId =
    typeof raw.customerId === "string" ? raw.customerId.trim() : undefined;
  const recurringPlanId =
    typeof raw.recurringPlanId === "string"
      ? raw.recurringPlanId.trim()
      : undefined;
  const recurringOccurrenceId =
    typeof raw.recurringOccurrenceId === "string"
      ? raw.recurringOccurrenceId.trim()
      : undefined;
  const evaluationAnchor =
    typeof raw.evaluationAnchor === "string"
      ? raw.evaluationAnchor.trim()
      : undefined;

  void snapshotInputJson;

  return {
    bookingId,
    snapshotOutputJson,
    snapshotInputJson,
    evolutionInput,
    persistCheckpoint,
    sourceKind,
    effectiveAt,
    subjectType,
    subjectId,
    customerId,
    recurringPlanId,
    recurringOccurrenceId,
    evaluationAnchor,
  };
}

export function assertReplaySubjectPresent(params: {
  subjectType?: string;
  subjectId?: string;
  mode: "snapshot" | "explicit";
}) {
  if (!params.subjectType || !params.subjectId) {
    throw new BadRequestException("MAINTENANCE_REPLAY_SUBJECT_REQUIRED");
  }
}

export function parseEffectiveAtIso(
  raw: string | undefined,
  fallback: Date,
): Date {
  if (!raw?.trim()) return fallback;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException("MAINTENANCE_REPLAY_EFFECTIVE_AT_INVALID");
  }
  return d;
}

export function normalizeReplaySourceKind(params: {
  requested?: string;
  mode: "booking" | "snapshot" | "explicit";
}): MaintenanceCheckpointSourceKind {
  if (params.requested?.trim()) {
    return params.requested as MaintenanceCheckpointSourceKind;
  }
  if (params.mode === "booking") return "quote_snapshot";
  return "replay_job";
}
