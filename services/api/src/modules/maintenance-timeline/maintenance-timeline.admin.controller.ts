import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { AdminPermissions } from "../../common/admin/admin-permissions.decorator";
import { AdminPermissionsGuard } from "../../common/admin/admin-permissions.guard";
import { fnv1aHex } from "../../estimating/maintenance-state/maintenance-state-evolution";
import type {
  MaintenanceStateEvolutionInput,
  MaintenanceStateEvolutionResult,
} from "../../estimating/maintenance-state/maintenance-state.types";
import { stableJsonStringify } from "../../estimating/maintenance-timeline";
import type { MaintenanceCheckpointCreatePayload } from "../../estimating/maintenance-timeline/maintenance-timeline.types";
import {
  assertReplaySubjectPresent,
  normalizeReplaySourceKind,
  parseEffectiveAtIso,
  parseMaintenanceReplayDto,
} from "./dto/maintenance-replay.dto";
import { MaintenanceTimelineService } from "./maintenance-timeline.service";

type AuthedRequest = {
  user?: { userId?: string; role?: string; email?: string };
};

const REPLAY_API_VERSION = "maintenance_replay_api_v1";

function checkpointPreviewForJson(payload: MaintenanceCheckpointCreatePayload) {
  return {
    ...payload,
    provenance:
      payload.provenance === undefined || payload.provenance === Prisma.JsonNull
        ? null
        : payload.provenance,
  };
}

function compactPersistedCheckpointMeta(
  row: import("@prisma/client").MaintenanceStateCheckpoint,
) {
  return {
    id: row.id,
    subjectType: row.subjectType,
    subjectId: row.subjectId,
    customerId: row.customerId,
    recurringPlanId: row.recurringPlanId,
    bookingId: row.bookingId,
    recurringOccurrenceId: row.recurringOccurrenceId,
    effectiveAt: row.effectiveAt,
    sourceKind: row.sourceKind,
    schemaVersion: row.schemaVersion,
    engineVersion: row.engineVersion,
    inputFingerprint: row.inputFingerprint,
    outputFingerprint: row.outputFingerprint,
    stateClassification: row.stateClassification,
    maintenanceScore: row.maintenanceScore,
    degradationPressure: row.degradationPressure,
    retentionStrength: row.retentionStrength,
    projectedRiskLevel: row.projectedRiskLevel,
    resetReviewPressure: row.resetReviewPressure,
    supersedesCheckpointId: row.supersedesCheckpointId,
    createdAt: row.createdAt,
  };
}

function collectReplayWarnings(params: {
  persisted?: MaintenanceStateEvolutionResult | undefined;
  replay: MaintenanceStateEvolutionResult;
}): string[] {
  const warnings: string[] = [];
  const persisted = params.persisted;
  if (!persisted) return warnings;
  if (
    persisted.currentState.maintenanceScore !==
      params.replay.currentState.maintenanceScore ||
    persisted.currentState.stateClassification !==
      params.replay.currentState.stateClassification
  ) {
    warnings.push(
      "MAINTENANCE_REPLAY_DIFFERS_FROM_SNAPSHOT_PERSISTED_EVOLUTION",
    );
  }
  return warnings;
}

@Controller("api/v1/admin/maintenance-state")
@UseGuards(JwtAuthGuard, AdminGuard, AdminPermissionsGuard)
export class MaintenanceTimelineAdminController {
  constructor(private readonly timeline: MaintenanceTimelineService) {}

  /**
   * Requires `exceptions.read` today; `persistCheckpoint` remains explicit and should map to
   * `exceptions.write` once granular admin RBAC replaces launch-wide admin grants.
   */
  @Post("replay")
  @AdminPermissions("exceptions.read")
  @HttpCode(HttpStatus.OK)
  async replay(@Req() req: AuthedRequest, @Body() body: unknown) {
    if (!req.user?.userId) {
      throw new UnauthorizedException();
    }

    const dto = parseMaintenanceReplayDto(body);

    const actorUserId = req.user.userId;

    let replay: MaintenanceStateEvolutionResult;
    let evolutionInput: MaintenanceStateEvolutionInput;
    let snapshotMeta:
      | {
          estimatorVersion?: string;
          persistedMaintenanceEvolution?: MaintenanceStateEvolutionResult;
        }
      | undefined;

    let subjectType: string;
    let subjectId: string;
    let customerId: string | null | undefined;
    let bookingId: string | null | undefined;
    let effectiveAt: Date;
    let mode: "booking" | "snapshot" | "explicit";

    if (dto.bookingId) {
      mode = "booking";
      const run = await this.timeline.replayFromBooking({
        bookingId: dto.bookingId,
        recurringPlanId: dto.recurringPlanId ?? null,
        recurringOccurrenceId: dto.recurringOccurrenceId ?? null,
      });
      replay = run.replay;
      evolutionInput = run.evolutionInput;
      snapshotMeta = run.snapshotMeta;
      subjectType = "booking";
      subjectId = dto.bookingId;
      customerId = run.bookingCustomerId;
      bookingId = dto.bookingId;
      effectiveAt = parseEffectiveAtIso(
        dto.effectiveAt,
        run.bookingCreatedAt,
      );
    } else if (dto.snapshotOutputJson) {
      mode = "snapshot";
      assertReplaySubjectPresent({
        subjectType: dto.subjectType,
        subjectId: dto.subjectId,
        mode: "snapshot",
      });
      const anchor =
        dto.evaluationAnchor?.trim() ??
        `replay:snapshot:${fnv1aHex(stableJsonStringify({ snippet: dto.snapshotOutputJson.slice(0, 2048) }))}`;
      const run = this.timeline.replayFromSnapshotJson({
        snapshotOutputJson: dto.snapshotOutputJson,
        snapshotInputFallback: dto.snapshotInputJson ?? null,
        evaluationAnchor: anchor,
      });
      replay = run.replay;
      evolutionInput = run.evolutionInput;
      snapshotMeta = run.snapshotMeta;
      subjectType = dto.subjectType!;
      subjectId = dto.subjectId!;
      customerId = dto.customerId ?? null;
      bookingId = dto.bookingId ?? null;
      effectiveAt = parseEffectiveAtIso(dto.effectiveAt, new Date());
    } else if (dto.evolutionInput) {
      mode = "explicit";
      assertReplaySubjectPresent({
        subjectType: dto.subjectType,
        subjectId: dto.subjectId,
        mode: "explicit",
      });
      const run = this.timeline.replayFromExplicitEvolutionInput({
        evolutionInput: dto.evolutionInput,
      });
      replay = run.replay;
      evolutionInput = run.evolutionInput;
      snapshotMeta = undefined;
      subjectType = dto.subjectType!;
      subjectId = dto.subjectId!;
      customerId = dto.customerId ?? null;
      bookingId = dto.bookingId ?? null;
      effectiveAt = parseEffectiveAtIso(dto.effectiveAt, new Date());
    } else {
      throw new BadRequestException("MAINTENANCE_REPLAY_INPUT_MISSING");
    }

    const sourceKind = normalizeReplaySourceKind({
      requested: dto.sourceKind,
      mode,
    });

    const warnings = collectReplayWarnings({
      persisted: snapshotMeta?.persistedMaintenanceEvolution,
      replay,
    });

    const checkpointPreview = this.timeline.buildCheckpointCreatePayload({
      subjectType,
      subjectId,
      customerId: customerId ?? null,
      recurringPlanId: dto.recurringPlanId ?? null,
      bookingId: bookingId ?? null,
      recurringOccurrenceId: dto.recurringOccurrenceId ?? null,
      effectiveAt,
      sourceKind,
      evolutionInput,
      evolutionResult: replay,
      provenance: {
        replayApiVersion: REPLAY_API_VERSION,
        estimatorVersion: snapshotMeta?.estimatorVersion,
        bookingId: bookingId ?? null,
        recurringPlanId: dto.recurringPlanId ?? null,
        recurringOccurrenceId: dto.recurringOccurrenceId ?? null,
        actorUserId,
      },
    });

    let persistedCheckpoint:
      | ReturnType<typeof compactPersistedCheckpointMeta>
      | undefined;
    let idempotencyResult:
      | { idempotentHit: boolean; checkpointId: string }
      | undefined;

    if (dto.persistCheckpoint) {
      const rec = await this.timeline.recordCheckpoint(checkpointPreview);
      persistedCheckpoint = compactPersistedCheckpointMeta(rec.row);
      idempotencyResult = {
        idempotentHit: rec.idempotentHit,
        checkpointId: rec.row.id,
      };
    }

    return {
      replay,
      evolutionInput,
      checkpointPreview: checkpointPreviewForJson(checkpointPreview),
      persistedCheckpoint,
      idempotencyResult,
      warnings,
    };
  }

  @Get("checkpoints")
  @AdminPermissions("exceptions.read")
  async listCheckpoints(
    @Query("subjectType") subjectType?: string,
    @Query("subjectId") subjectId?: string,
    @Query("customerId") customerId?: string,
    @Query("recurringPlanId") recurringPlanId?: string,
    @Query("bookingId") bookingId?: string,
    @Query("limit") limitRaw?: string,
    @Query("order") orderRaw?: string,
  ) {
    const st = subjectType?.trim();
    const sid = subjectId?.trim();
    if ((st && !sid) || (!st && sid)) {
      throw new BadRequestException(
        "MAINTENANCE_CHECKPOINT_SUBJECT_PAIR_REQUIRED",
      );
    }

    let limit: number | undefined;
    if (limitRaw != null && limitRaw !== "") {
      const n = Number(limitRaw);
      if (!Number.isFinite(n)) {
        throw new BadRequestException(
          "MAINTENANCE_CHECKPOINT_LIST_LIMIT_INVALID",
        );
      }
      limit = n;
    }

    const orderTrim = orderRaw?.trim().toLowerCase();
    const order =
      orderTrim === "asc" || orderTrim === "desc" ? orderTrim : undefined;
    if (orderRaw != null && orderRaw !== "" && order === undefined) {
      throw new BadRequestException("MAINTENANCE_CHECKPOINT_LIST_ORDER_INVALID");
    }

    return this.timeline.listCheckpoints({
      subjectType: st,
      subjectId: sid,
      customerId: customerId?.trim(),
      recurringPlanId: recurringPlanId?.trim(),
      bookingId: bookingId?.trim(),
      limit,
      order,
    });
  }
}
