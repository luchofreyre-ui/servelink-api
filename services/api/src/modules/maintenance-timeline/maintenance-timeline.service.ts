import {
  BadRequestException,
  Injectable,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { MaintenanceStateCheckpoint } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import {
  buildMaintenanceEvolutionInputFromEstimateContext,
} from "../../estimating/maintenance-state/maintenance-evolution-from-estimate-context";
import { evaluateMaintenanceStateEvolution } from "../../estimating/maintenance-state/maintenance-state-evolution";
import { MAINTENANCE_STATE_SCHEMA_VERSION } from "../../estimating/maintenance-state/maintenance-state.types";
import type {
  MaintenanceStateEvolutionInput,
  MaintenanceStateEvolutionResult,
} from "../../estimating/maintenance-state/maintenance-state.types";
import {
  compactMaintenanceEvolutionForCheckpointPayload,
  computeCheckpointInputFingerprint,
  computeOutputFingerprintFromEvolution,
  MAINTENANCE_TIMELINE_ENGINE_VERSION,
  parseEstimateSnapshotOutputForMaintenanceReplay,
} from "../../estimating/maintenance-timeline";
import type {
  CheckpointProvenance,
  MaintenanceCheckpointCreatePayload,
} from "../../estimating/maintenance-timeline/maintenance-timeline.types";
import type { MaintenanceCheckpointSourceKind } from "../../estimating/maintenance-timeline/maintenance-timeline.types";

function roundScore(n: number): number {
  return Math.round(Math.min(100, Math.max(0, n)));
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v && typeof v === "object" && !Array.isArray(v));
}

@Injectable()
export class MaintenanceTimelineService {
  constructor(private readonly prisma: PrismaService) {}

  /** subjectType/subjectId: see docs/maintenance-subject-identity-governance-v1.md — do not treat customer as property identity. */
  buildCheckpointCreatePayload(params: {
    subjectType: string;
    subjectId: string;
    customerId?: string | null;
    recurringPlanId?: string | null;
    bookingId?: string | null;
    recurringOccurrenceId?: string | null;
    effectiveAt: Date;
    sourceKind: MaintenanceCheckpointSourceKind;
    evolutionInput: MaintenanceStateEvolutionInput;
    evolutionResult: MaintenanceStateEvolutionResult;
    provenance?: CheckpointProvenance | null;
    supersedesCheckpointId?: string | null;
  }): MaintenanceCheckpointCreatePayload {
    const effectiveAtIso = params.effectiveAt.toISOString();
    const inputFingerprint = computeCheckpointInputFingerprint({
      subjectType: params.subjectType,
      subjectId: params.subjectId,
      effectiveAtIso,
      sourceKind: params.sourceKind,
      evolutionInput: params.evolutionInput,
    });
    const compact = compactMaintenanceEvolutionForCheckpointPayload(
      params.evolutionResult,
    );
    const outputFingerprint =
      computeOutputFingerprintFromEvolution(params.evolutionResult);

    const cur = params.evolutionResult.currentState;

    return {
      subjectType: params.subjectType,
      subjectId: params.subjectId,
      customerId: params.customerId ?? null,
      recurringPlanId: params.recurringPlanId ?? null,
      bookingId: params.bookingId ?? null,
      recurringOccurrenceId: params.recurringOccurrenceId ?? null,
      effectiveAt: params.effectiveAt,
      sourceKind: params.sourceKind,
      schemaVersion: MAINTENANCE_STATE_SCHEMA_VERSION,
      engineVersion: MAINTENANCE_TIMELINE_ENGINE_VERSION,
      inputFingerprint,
      outputFingerprint,
      stateClassification: cur.stateClassification,
      maintenanceScore: roundScore(cur.maintenanceScore),
      degradationPressure: roundScore(cur.degradationPressure),
      retentionStrength: roundScore(cur.retentionStrength),
      projectedRiskLevel: params.evolutionResult.projectedRiskLevel ?? null,
      resetReviewPressure: params.evolutionResult.resetReviewPressure ?? null,
      payload: compact as Prisma.InputJsonValue,
      provenance:
        params.provenance === undefined || params.provenance === null
          ? Prisma.JsonNull
          : (JSON.parse(
              JSON.stringify(params.provenance),
            ) as Prisma.InputJsonValue),
      supersedesCheckpointId: params.supersedesCheckpointId ?? null,
    };
  }

  async recordCheckpoint(
    payload: MaintenanceCheckpointCreatePayload,
  ): Promise<{ row: MaintenanceStateCheckpoint; idempotentHit: boolean }> {
    const existing = await this.prisma.maintenanceStateCheckpoint.findFirst({
      where: {
        subjectType: payload.subjectType,
        subjectId: payload.subjectId,
        sourceKind: payload.sourceKind,
        inputFingerprint: payload.inputFingerprint,
      },
    });
    if (existing) {
      return { row: existing, idempotentHit: true };
    }

    try {
      const row = await this.prisma.maintenanceStateCheckpoint.create({
        data: {
          subjectType: payload.subjectType,
          subjectId: payload.subjectId,
          customerId: payload.customerId,
          recurringPlanId: payload.recurringPlanId,
          bookingId: payload.bookingId,
          recurringOccurrenceId: payload.recurringOccurrenceId,
          effectiveAt: payload.effectiveAt,
          sourceKind: payload.sourceKind,
          schemaVersion: payload.schemaVersion,
          engineVersion: payload.engineVersion,
          inputFingerprint: payload.inputFingerprint,
          outputFingerprint: payload.outputFingerprint,
          stateClassification: payload.stateClassification,
          maintenanceScore: payload.maintenanceScore,
          degradationPressure: payload.degradationPressure,
          retentionStrength: payload.retentionStrength,
          projectedRiskLevel: payload.projectedRiskLevel,
          resetReviewPressure: payload.resetReviewPressure,
          payload: payload.payload,
          provenance: payload.provenance ?? Prisma.JsonNull,
          supersedesCheckpointId: payload.supersedesCheckpointId,
        },
      });
      return { row, idempotentHit: false };
    } catch (err: unknown) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code?: string }).code)
          : "";
      if (code === "P2002") {
        const again = await this.prisma.maintenanceStateCheckpoint.findFirst({
          where: {
            subjectType: payload.subjectType,
            subjectId: payload.subjectId,
            sourceKind: payload.sourceKind,
            inputFingerprint: payload.inputFingerprint,
          },
        });
        if (again) return { row: again, idempotentHit: true };
      }
      throw err;
    }
  }

  async replayFromBooking(params: {
    bookingId: string;
    overrides?: Partial<MaintenanceStateEvolutionInput>;
    recurringPlanId?: string | null;
    recurringOccurrenceId?: string | null;
  }): Promise<{
    replay: MaintenanceStateEvolutionResult;
    evolutionInput: MaintenanceStateEvolutionInput;
    bookingCustomerId: string;
    bookingCreatedAt: Date;
    snapshotMeta: {
      estimatorVersion?: string;
      persistedMaintenanceEvolution?: MaintenanceStateEvolutionResult;
    };
  }> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: params.bookingId },
      select: {
        id: true,
        customerId: true,
        createdAt: true,
        estimateSnapshot: { select: { outputJson: true } },
      },
    });
    if (!booking?.estimateSnapshot?.outputJson) {
      throw new BadRequestException("MAINTENANCE_REPLAY_BOOKING_SNAPSHOT_MISSING");
    }

    const parsed = parseEstimateSnapshotOutputForMaintenanceReplay(
      booking.estimateSnapshot.outputJson,
    );

    const evolutionInput = buildMaintenanceEvolutionInputFromEstimateContext({
      input: parsed.estimateInput,
      confidenceBreakdown: parsed.confidenceBreakdown,
      escalationGovernance: parsed.escalationGovernance,
      recurringEconomicsGovernance: parsed.recurringEconomicsGovernance,
      overrides: {
        ...params.overrides,
        evaluationAnchor:
          params.overrides?.evaluationAnchor ??
          `booking:${params.bookingId}:replay`,
      },
    });

    const replay = evaluateMaintenanceStateEvolution(evolutionInput);

    return {
      replay,
      evolutionInput,
      bookingCustomerId: booking.customerId,
      bookingCreatedAt: booking.createdAt,
      snapshotMeta: {
        estimatorVersion: parsed.estimatorVersion,
        persistedMaintenanceEvolution: parsed.persistedMaintenanceEvolution,
      },
    };
  }

  replayFromSnapshotJson(params: {
    snapshotOutputJson: string;
    snapshotInputFallback?: string | null;
    overrides?: Partial<MaintenanceStateEvolutionInput>;
    evaluationAnchor: string;
  }): {
    replay: MaintenanceStateEvolutionResult;
    evolutionInput: MaintenanceStateEvolutionInput;
    snapshotMeta: {
      estimatorVersion?: string;
      persistedMaintenanceEvolution?: MaintenanceStateEvolutionResult;
    };
  } {
    void params.snapshotInputFallback;
    const parsed = parseEstimateSnapshotOutputForMaintenanceReplay(
      params.snapshotOutputJson,
    );

    const evolutionInput = buildMaintenanceEvolutionInputFromEstimateContext({
      input: parsed.estimateInput,
      confidenceBreakdown: parsed.confidenceBreakdown,
      escalationGovernance: parsed.escalationGovernance,
      recurringEconomicsGovernance: parsed.recurringEconomicsGovernance,
      overrides: {
        ...params.overrides,
        evaluationAnchor:
          params.overrides?.evaluationAnchor ?? params.evaluationAnchor,
      },
    });

    const replay = evaluateMaintenanceStateEvolution(evolutionInput);

    return {
      replay,
      evolutionInput,
      snapshotMeta: {
        estimatorVersion: parsed.estimatorVersion,
        persistedMaintenanceEvolution: parsed.persistedMaintenanceEvolution,
      },
    };
  }

  replayFromExplicitEvolutionInput(params: {
    evolutionInput: Record<string, unknown>;
    mergeDefaults?: Partial<MaintenanceStateEvolutionInput>;
  }): {
    replay: MaintenanceStateEvolutionResult;
    evolutionInput: MaintenanceStateEvolutionInput;
  } {
    const raw = params.evolutionInput;
    if (!isRecord(raw)) {
      throw new BadRequestException("MAINTENANCE_REPLAY_EVOLUTION_INPUT_INVALID");
    }
    const anchor = raw.evaluationAnchor;
    const cadence = raw.cadenceIntent;
    if (typeof anchor !== "string" || !anchor.trim()) {
      throw new BadRequestException("MAINTENANCE_REPLAY_ANCHOR_REQUIRED");
    }
    if (typeof cadence !== "string" || !cadence.trim()) {
      throw new BadRequestException("MAINTENANCE_REPLAY_CADENCE_REQUIRED");
    }

    const merged = {
      ...params.mergeDefaults,
      ...raw,
      evaluationAnchor: anchor,
      cadenceIntent: cadence,
    } as MaintenanceStateEvolutionInput;

    const replay = evaluateMaintenanceStateEvolution(merged);
    return { replay, evolutionInput: merged };
  }

  async listCheckpoints(params: {
    subjectType?: string;
    subjectId?: string;
    customerId?: string;
    recurringPlanId?: string;
    bookingId?: string;
    limit?: number;
    order?: "asc" | "desc";
  }) {
    const limit = Math.min(Math.max(params.limit ?? 50, 1), 200);
    const order = params.order ?? "desc";

    const where: Prisma.MaintenanceStateCheckpointWhereInput = {};
    if (params.subjectType && params.subjectId) {
      where.subjectType = params.subjectType;
      where.subjectId = params.subjectId;
    }
    if (params.customerId) where.customerId = params.customerId;
    if (params.recurringPlanId) where.recurringPlanId = params.recurringPlanId;
    if (params.bookingId) where.bookingId = params.bookingId;

    return this.prisma.maintenanceStateCheckpoint.findMany({
      where,
      orderBy: { effectiveAt: order },
      take: limit,
      select: {
        id: true,
        subjectType: true,
        subjectId: true,
        customerId: true,
        recurringPlanId: true,
        bookingId: true,
        recurringOccurrenceId: true,
        effectiveAt: true,
        sourceKind: true,
        schemaVersion: true,
        engineVersion: true,
        inputFingerprint: true,
        outputFingerprint: true,
        stateClassification: true,
        maintenanceScore: true,
        degradationPressure: true,
        retentionStrength: true,
        projectedRiskLevel: true,
        resetReviewPressure: true,
        createdAt: true,
      },
    });
  }
}
