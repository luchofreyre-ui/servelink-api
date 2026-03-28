import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  Prisma,
  SystemTestIncidentActionPriority,
  SystemTestIncidentActionStatus,
  SystemTestIncidentEventType,
  SystemTestIncidentStepExecutionStatus,
} from "@prisma/client";

import { PrismaService } from "../../prisma";
import type { IncidentValidationState } from "./system-test-incident-lifecycle.types";
import { SystemTestIncidentAutomationService } from "./system-test-incident-automation.service";
import type {
  SystemTestIncidentActionDetailDto,
  SystemTestIncidentActionListItemDto,
  SystemTestIncidentEventDto,
  SystemTestIncidentNoteDto,
  SystemTestIncidentStepExecutionDto,
} from "./dto/system-test-incident-actions.dto";

const PRIORITY_RANK: Record<SystemTestIncidentActionPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const ALLOWED_STATUS_TRANSITIONS: Record<
  SystemTestIncidentActionStatus,
  SystemTestIncidentActionStatus[]
> = {
  open: ["investigating", "fixing", "dismissed"],
  investigating: ["open", "fixing", "validating", "dismissed"],
  fixing: ["investigating", "validating", "dismissed"],
  validating: ["fixing", "resolved", "dismissed"],
  resolved: ["fixing"],
  dismissed: ["open"],
};

function isResolvedLike(status: SystemTestIncidentActionStatus): boolean {
  return status === "resolved" || status === "dismissed";
}

function slaOrderingRank(status: string | null | undefined): number {
  if (!status) return 5;
  switch (status) {
    case "overdue":
      return 0;
    case "due_soon":
      return 1;
    case "on_track":
      return 2;
    case "paused":
      return 3;
    case "completed":
      return 4;
    default:
      return 5;
  }
}

function parseStringArrayJson(json: unknown): string[] {
  if (!Array.isArray(json)) return [];
  return json.filter((x): x is string => typeof x === "string");
}

type DbClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class SystemTestIncidentActionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly automation: SystemTestIncidentAutomationService,
  ) {}

  coerceEnumArray<T extends string>(
    raw: string | string[] | undefined,
    allowed: readonly T[],
    field: string,
  ): T[] | undefined {
    if (raw === undefined) return undefined;
    const arr = (Array.isArray(raw) ? raw : [raw]).map(String);
    const out: T[] = [];
    for (const x of arr) {
      if (!allowed.includes(x as T)) {
        throw new BadRequestException(`INVALID_QUERY_${field.toUpperCase()}: ${x}`);
      }
      out.push(x as T);
    }
    return out.length ? out : undefined;
  }

  assertTransitionAllowed(
    from: SystemTestIncidentActionStatus,
    to: SystemTestIncidentActionStatus,
  ): void {
    const allowed = ALLOWED_STATUS_TRANSITIONS[from];
    if (!allowed?.includes(to)) {
      throw new BadRequestException(
        `INVALID_STATUS_TRANSITION: ${from} → ${to}`,
      );
    }
  }

  async createEvent(
    tx: DbClient,
    params: {
      incidentActionId: string;
      incidentKey: string;
      type: SystemTestIncidentEventType;
      actorUserId?: string | null;
      metadataJson?: Record<string, unknown> | null;
    },
  ): Promise<void> {
    await tx.systemTestIncidentEvent.create({
      data: {
        incidentActionId: params.incidentActionId,
        incidentKey: params.incidentKey,
        type: params.type,
        actorUserId: params.actorUserId ?? null,
        metadataJson:
          params.metadataJson === undefined ? undefined
          : params.metadataJson === null ? Prisma.JsonNull
          : (params.metadataJson as Prisma.InputJsonValue),
      },
    });
  }

  async getFixTrackForKey(incidentKey: string) {
    return this.prisma.systemTestIncidentFixTrack.findUnique({
      where: { incidentKey },
    });
  }

  async getLatestIncidentForKey(incidentKey: string) {
    return this.prisma.systemTestIncident.findFirst({
      where: { incidentKey },
      orderBy: { createdAt: "desc" },
    });
  }

  async ensureActionForIncidentKey(params: {
    incidentKey: string;
    actorUserId?: string | null;
  }) {
    const existing = await this.prisma.systemTestIncidentAction.findUnique({
      where: { incidentKey: params.incidentKey },
    });
    if (existing) {
      return existing;
    }

    const fixTrack = await this.getFixTrackForKey(params.incidentKey);
    if (!fixTrack) {
      throw new NotFoundException("SYSTEM_TEST_INCIDENT_ACTION_NOT_BOOTSTRAPPABLE");
    }

    const index = await this.prisma.systemTestIncidentIndex.findUnique({
      where: { incidentKey: params.incidentKey },
    });

    const recommended = parseStringArrayJson(fixTrack.recommendedStepsJson);

    const created = await this.prisma.$transaction(async (tx) => {
      const action = await tx.systemTestIncidentAction.create({
        data: {
          incidentKey: params.incidentKey,
          status: "open",
          priority: "medium",
          lastSeenRunId: index?.lastSeenRunId ?? null,
        },
      });

      await this.createEvent(tx, {
        incidentActionId: action.id,
        incidentKey: params.incidentKey,
        type: "action_created",
        actorUserId: params.actorUserId ?? null,
        metadataJson: {},
      });

      if (recommended.length > 0) {
        await tx.systemTestIncidentStepExecution.createMany({
          data: recommended.map((_, stepIndex) => ({
            incidentActionId: action.id,
            stepIndex,
            status: "pending" satisfies SystemTestIncidentStepExecutionStatus,
          })),
        });
      }

      return action;
    });

    await this.automation.handleActionChanged({
      incidentKey: params.incidentKey,
    });

    return created;
  }

  async touchLastSeenRun(params: {
    incidentKey: string;
    runId: string;
    actorUserId?: string | null;
  }): Promise<{
    actionId: string;
    previousLastSeenRunId: string | null;
    currentStatus: SystemTestIncidentActionStatus;
  }> {
    const action = await this.ensureActionForIncidentKey({
      incidentKey: params.incidentKey,
      actorUserId: params.actorUserId,
    });
    const previousLastSeenRunId = action.lastSeenRunId;
    if (previousLastSeenRunId === params.runId) {
      return {
        actionId: action.id,
        previousLastSeenRunId,
        currentStatus: action.status,
      };
    }
    const updated = await this.prisma.systemTestIncidentAction.update({
      where: { id: action.id },
      data: { lastSeenRunId: params.runId },
    });
    return {
      actionId: updated.id,
      previousLastSeenRunId,
      currentStatus: updated.status,
    };
  }

  async transitionStatusInternal(
    params: {
      incidentKey: string;
      nextStatus: SystemTestIncidentActionStatus;
      actorUserId?: string | null;
      reason: string;
      skipTransitionValidation?: boolean;
      clearResolvedAt?: boolean;
      setResolvedAtNow?: boolean;
      extraActionPatch?: Prisma.SystemTestIncidentActionUpdateInput;
      tx?: Prisma.TransactionClient;
    },
  ): Promise<void> {
    const run = async (tx: DbClient) => {
      const row = await tx.systemTestIncidentAction.findUnique({
        where: { incidentKey: params.incidentKey },
      });
      if (!row) {
        throw new NotFoundException("SYSTEM_TEST_INCIDENT_ACTION_NOT_FOUND");
      }
      if (!params.skipTransitionValidation) {
        this.assertTransitionAllowed(row.status, params.nextStatus);
      }

      let resolvedAt: Date | null | undefined = undefined;
      if (params.clearResolvedAt) {
        resolvedAt = null;
      } else if (params.setResolvedAtNow) {
        resolvedAt = new Date();
      } else if (params.nextStatus === "resolved" && row.status !== "resolved") {
        resolvedAt = new Date();
      } else if (row.status === "resolved" && params.nextStatus !== "resolved") {
        resolvedAt = null;
      }

      const data: Prisma.SystemTestIncidentActionUpdateInput = {
        status: params.nextStatus,
        ...(resolvedAt !== undefined ? { resolvedAt } : {}),
        ...(params.extraActionPatch ?? {}),
      };

      await tx.systemTestIncidentAction.update({
        where: { id: row.id },
        data,
      });

      await this.createEvent(tx, {
        incidentActionId: row.id,
        incidentKey: params.incidentKey,
        type: "status_changed",
        actorUserId: params.actorUserId ?? null,
        metadataJson: {
          beforeStatus: row.status,
          afterStatus: params.nextStatus,
          reason: params.reason,
        },
      });
    };

    if (params.tx) {
      await run(params.tx);
    } else {
      await this.prisma.$transaction(async (tx) => run(tx));
    }
  }

  async recordLifecycleEvent(params: {
    incidentKey: string;
    type: SystemTestIncidentEventType;
    actorUserId?: string | null;
    metadataJson?: Record<string, unknown> | null;
    tx?: Prisma.TransactionClient;
  }): Promise<void> {
    const exec = async (tx: DbClient) => {
      const action = await tx.systemTestIncidentAction.findUnique({
        where: { incidentKey: params.incidentKey },
      });
      if (!action) {
        throw new NotFoundException("SYSTEM_TEST_INCIDENT_ACTION_NOT_FOUND");
      }
      await this.createEvent(tx, {
        incidentActionId: action.id,
        incidentKey: params.incidentKey,
        type: params.type,
        actorUserId: params.actorUserId ?? null,
        metadataJson: params.metadataJson,
      });
    };
    if (params.tx) {
      await exec(params.tx);
    } else {
      await this.prisma.$transaction(async (tx) => exec(tx));
    }
  }

  async setValidationState(params: {
    incidentKey: string;
    validationState: IncidentValidationState;
    checkedAt?: Date;
    passedAt?: Date | null;
    failedAt?: Date | null;
    reopenedAt?: Date | null;
    incrementReopenCount?: boolean;
    tx?: Prisma.TransactionClient;
  }): Promise<void> {
    const data: Prisma.SystemTestIncidentActionUpdateInput = {
      validationState: params.validationState,
    };
    if (params.checkedAt !== undefined) {
      data.validationLastCheckedAt = params.checkedAt;
    }
    if (params.passedAt !== undefined) {
      data.validationLastPassedAt = params.passedAt;
    }
    if (params.failedAt !== undefined) {
      data.validationLastFailedAt = params.failedAt;
    }
    if (params.reopenedAt !== undefined) {
      data.reopenedAt = params.reopenedAt;
    }
    if (params.incrementReopenCount) {
      data.reopenCount = { increment: 1 };
    }

    const apply = async (tx: DbClient) => {
      await tx.systemTestIncidentAction.update({
        where: { incidentKey: params.incidentKey },
        data,
      });
    };

    if (params.tx) {
      await apply(params.tx);
    } else {
      await this.prisma.$transaction(async (tx) => apply(tx));
    }
  }

  async listActions(params: {
    status?: string | string[];
    priority?: string | string[];
    ownerUserId?: string;
    search?: string;
    limit?: number;
    validationState?: string | string[];
    needsValidation?: boolean;
    slaStatus?: string | string[];
    escalationReady?: boolean;
    unassignedOnly?: boolean;
  }): Promise<{ items: SystemTestIncidentActionListItemDto[]; count: number }> {
    const limit = Math.min(Math.max(params.limit ?? 50, 1), 200);

    const statusFilter = this.coerceEnumArray<SystemTestIncidentActionStatus>(
      params.status,
      [
        "open",
        "investigating",
        "fixing",
        "validating",
        "resolved",
        "dismissed",
      ],
      "status",
    );

    const priorityFilter = this.coerceEnumArray<SystemTestIncidentActionPriority>(
      params.priority,
      ["critical", "high", "medium", "low"],
      "priority",
    );

    const validationStateFilter = this.coerceEnumArray<string>(
      params.validationState,
      ["pending", "passed", "failed"],
      "validationState",
    );

    const slaStatusFilter = this.coerceEnumArray<string>(
      params.slaStatus,
      ["on_track", "due_soon", "overdue", "paused", "completed"],
      "slaStatus",
    );

    const andParts: Prisma.SystemTestIncidentActionWhereInput[] = [];

    if (statusFilter?.length) {
      andParts.push({ status: { in: statusFilter } });
    }
    if (priorityFilter?.length) {
      andParts.push({ priority: { in: priorityFilter } });
    }
    if (validationStateFilter?.length) {
      andParts.push({ validationState: { in: validationStateFilter } });
    }
    if (params.needsValidation === true) {
      andParts.push({
        status: "resolved",
        OR: [
          { validationState: null },
          { validationState: { not: "passed" } },
        ],
      });
    }
    if (params.ownerUserId?.trim()) {
      andParts.push({ ownerUserId: params.ownerUserId.trim() });
    }
    if (params.unassignedOnly === true) {
      andParts.push({ ownerUserId: null });
    }
    if (params.escalationReady === true) {
      andParts.push({ escalationReadyAt: { not: null } });
    }
    if (slaStatusFilter?.length) {
      andParts.push({ slaStatus: { in: slaStatusFilter } });
    }

    if (params.search?.trim()) {
      const s = params.search.trim();
      const incidentRows = await this.prisma.systemTestIncident.findMany({
        where: {
          OR: [
            { summary: { contains: s, mode: "insensitive" } },
            { displayTitle: { contains: s, mode: "insensitive" } },
          ],
        },
        select: { incidentKey: true },
        take: 5000,
      });
      const keysFromIncidents = [...new Set(incidentRows.map((r) => r.incidentKey))];
      andParts.push({
        OR: [
          { incidentKey: { contains: s, mode: "insensitive" } },
          ...(keysFromIncidents.length ?
            [{ incidentKey: { in: keysFromIncidents } }]
          : []),
        ],
      });
    }

    const where: Prisma.SystemTestIncidentActionWhereInput =
      andParts.length ? { AND: andParts } : {};

    const rows = await this.prisma.systemTestIncidentAction.findMany({
      where,
      include: {
        owner: { select: { id: true, email: true } },
        stepExecutions: { select: { status: true } },
        _count: { select: { notes: true } },
      },
    });

    const keys = rows.map((r) => r.incidentKey);
    const incidents =
      keys.length > 0 ?
        await this.prisma.systemTestIncident.findMany({
          where: { incidentKey: { in: keys } },
          orderBy: { createdAt: "desc" },
        })
      : [];

    const latestByKey = new Map<string, (typeof incidents)[0]>();
    for (const inc of incidents) {
      if (!latestByKey.has(inc.incidentKey)) {
        latestByKey.set(inc.incidentKey, inc);
      }
    }

    rows.sort((a, b) => {
      const aDone = isResolvedLike(a.status);
      const bDone = isResolvedLike(b.status);
      if (aDone !== bDone) return aDone ? 1 : -1;
      const sr =
        slaOrderingRank(a.slaStatus) - slaOrderingRank(b.slaStatus);
      if (sr !== 0) return sr;
      const pr = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (pr !== 0) return pr;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });

    const sliced = rows.slice(0, limit);

    const items: SystemTestIncidentActionListItemDto[] = sliced.map((row) => {
      const latest = latestByKey.get(row.incidentKey) ?? null;
      const totalSteps = row.stepExecutions.length;
      const completedSteps = row.stepExecutions.filter(
        (s) => s.status === "completed",
      ).length;

      return {
        incidentKey: row.incidentKey,
        status: row.status,
        priority: row.priority,
        ownerUserId: row.ownerUserId,
        ownerName: row.owner?.email ?? null,
        lastSeenRunId: row.lastSeenRunId,
        resolvedAt: row.resolvedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        title: latest?.displayTitle ?? null,
        summary: latest?.summary ?? null,
        severity: latest?.severity ?? null,
        runId: latest?.runId ?? null,
        totalSteps,
        completedSteps,
        noteCount: row._count.notes,
        validationState: row.validationState ?? null,
        validationLastCheckedAt:
          row.validationLastCheckedAt?.toISOString() ?? null,
        validationLastPassedAt:
          row.validationLastPassedAt?.toISOString() ?? null,
        validationLastFailedAt:
          row.validationLastFailedAt?.toISOString() ?? null,
        reopenedAt: row.reopenedAt?.toISOString() ?? null,
        reopenCount: row.reopenCount,
        slaPolicyHours: row.slaPolicyHours ?? null,
        slaStartedAt: row.slaStartedAt?.toISOString() ?? null,
        slaDueAt: row.slaDueAt?.toISOString() ?? null,
        slaStatus: row.slaStatus ?? null,
        slaLastEvaluatedAt: row.slaLastEvaluatedAt?.toISOString() ?? null,
        escalationReadyAt: row.escalationReadyAt?.toISOString() ?? null,
      };
    });

    return { items, count: rows.length };
  }

  private async buildActionDetail(
    actionId: string,
  ): Promise<SystemTestIncidentActionDetailDto> {
    const action = await this.prisma.systemTestIncidentAction.findUnique({
      where: { id: actionId },
      include: {
        owner: { select: { id: true, email: true } },
        stepExecutions: { orderBy: { stepIndex: "asc" } },
        notes: { orderBy: { createdAt: "asc" }, include: { user: { select: { email: true } } } },
        events: {
          orderBy: { createdAt: "desc" },
          include: { actorUser: { select: { email: true } } },
        },
      },
    });

    if (!action) {
      throw new NotFoundException("SYSTEM_TEST_INCIDENT_ACTION_NOT_FOUND");
    }

    const latest = await this.getLatestIncidentForKey(action.incidentKey);
    const fixTrack = await this.getFixTrackForKey(action.incidentKey);

    const recommendedSteps = fixTrack ?
      parseStringArrayJson(fixTrack.recommendedStepsJson)
    : [];
    const validationSteps = fixTrack ?
      parseStringArrayJson(fixTrack.validationStepsJson)
    : [];

    const stepDtos: SystemTestIncidentStepExecutionDto[] =
      action.stepExecutions.map((s) => ({
        stepIndex: s.stepIndex,
        status: s.status,
        notes: s.notes,
        updatedAt: s.updatedAt.toISOString(),
      }));

    const noteDtos: SystemTestIncidentNoteDto[] = action.notes.map((n) => ({
      id: n.id,
      userId: n.userId,
      userName: n.user?.email ?? null,
      text: n.text,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    }));

    const eventDtos: SystemTestIncidentEventDto[] = action.events.map((e) => ({
      id: e.id,
      type: e.type,
      actorUserId: e.actorUserId,
      actorName: e.actorUser?.email ?? null,
      metadataJson:
        e.metadataJson === null || e.metadataJson === undefined ?
          null
        : (e.metadataJson as Record<string, unknown>),
      createdAt: e.createdAt.toISOString(),
    }));

    const incidentTitle =
      latest?.displayTitle?.trim() || latest?.summary?.slice(0, 120) || null;

    const validationState = action.validationState ?? null;

    return {
      incidentKey: action.incidentKey,
      status: action.status,
      priority: action.priority,
      ownerUserId: action.ownerUserId,
      ownerName: action.owner?.email ?? null,
      lastSeenRunId: action.lastSeenRunId,
      resolvedAt: action.resolvedAt?.toISOString() ?? null,
      createdAt: action.createdAt.toISOString(),
      updatedAt: action.updatedAt.toISOString(),
      validationState,
      validationLastCheckedAt:
        action.validationLastCheckedAt?.toISOString() ?? null,
      validationLastPassedAt:
        action.validationLastPassedAt?.toISOString() ?? null,
      validationLastFailedAt:
        action.validationLastFailedAt?.toISOString() ?? null,
      reopenedAt: action.reopenedAt?.toISOString() ?? null,
      reopenCount: action.reopenCount,
      isResolvedAwaitingValidation:
        action.status === "resolved" && validationState !== "passed",
      slaPolicyHours: action.slaPolicyHours ?? null,
      slaStartedAt: action.slaStartedAt?.toISOString() ?? null,
      slaDueAt: action.slaDueAt?.toISOString() ?? null,
      slaStatus: action.slaStatus ?? null,
      slaLastEvaluatedAt: action.slaLastEvaluatedAt?.toISOString() ?? null,
      escalationReadyAt: action.escalationReadyAt?.toISOString() ?? null,
      isOverdue: action.slaStatus === "overdue",
      isDueSoon: action.slaStatus === "due_soon",
      incidentSummary: latest?.summary ?? null,
      incidentSeverity: latest?.severity ?? null,
      incidentTitle,
      currentRunId: latest?.runId ?? null,
      fixTrackPrimaryArea: fixTrack?.primaryArea ?? null,
      recommendedSteps,
      validationSteps,
      stepExecutions: stepDtos,
      notes: noteDtos,
      events: eventDtos,
    };
  }

  async getActionDetail(
    incidentKey: string,
    actorUserId?: string | null,
  ): Promise<SystemTestIncidentActionDetailDto> {
    const action = await this.ensureActionForIncidentKey({
      incidentKey,
      actorUserId,
    });
    return this.buildActionDetail(action.id);
  }

  async updateOwner(params: {
    incidentKey: string;
    ownerUserId: string | null;
    actorUserId?: string | null;
  }): Promise<SystemTestIncidentActionDetailDto> {
    const action = await this.ensureActionForIncidentKey({
      incidentKey: params.incidentKey,
      actorUserId: params.actorUserId,
    });

    if (params.ownerUserId) {
      const user = await this.prisma.user.findUnique({
        where: { id: params.ownerUserId },
      });
      if (!user) {
        throw new NotFoundException("USER_NOT_FOUND");
      }
    }

    if (action.ownerUserId === params.ownerUserId) {
      return this.buildActionDetail(action.id);
    }

    const before = action.ownerUserId;

    await this.prisma.$transaction(async (tx) => {
      await tx.systemTestIncidentAction.update({
        where: { id: action.id },
        data: {
          ownerUserId: params.ownerUserId,
          ...(params.ownerUserId ?
            { lastNotificationQueuedAt: null }
          : {}),
        },
      });

      if (params.ownerUserId) {
        await this.createEvent(tx, {
          incidentActionId: action.id,
          incidentKey: params.incidentKey,
          type: "assigned",
          actorUserId: params.actorUserId ?? null,
          metadataJson: {
            beforeOwnerUserId: before,
            afterOwnerUserId: params.ownerUserId,
          },
        });
      } else {
        await this.createEvent(tx, {
          incidentActionId: action.id,
          incidentKey: params.incidentKey,
          type: "unassigned",
          actorUserId: params.actorUserId ?? null,
          metadataJson: {
            beforeOwnerUserId: before,
            afterOwnerUserId: null,
          },
        });
      }
    });

    await this.automation.handleActionChanged({
      incidentKey: params.incidentKey,
    });

    return this.buildActionDetail(action.id);
  }

  async assignToMe(params: {
    incidentKey: string;
    actorUserId: string;
  }): Promise<SystemTestIncidentActionDetailDto> {
    return this.updateOwner({
      incidentKey: params.incidentKey,
      ownerUserId: params.actorUserId,
      actorUserId: params.actorUserId,
    });
  }

  async updatePriority(params: {
    incidentKey: string;
    priority: SystemTestIncidentActionPriority;
    actorUserId?: string | null;
  }): Promise<SystemTestIncidentActionDetailDto> {
    const action = await this.ensureActionForIncidentKey({
      incidentKey: params.incidentKey,
      actorUserId: params.actorUserId,
    });

    if (action.priority === params.priority) {
      return this.buildActionDetail(action.id);
    }

    const before = action.priority;

    await this.prisma.$transaction(async (tx) => {
      await tx.systemTestIncidentAction.update({
        where: { id: action.id },
        data: { priority: params.priority },
      });

      await this.createEvent(tx, {
        incidentActionId: action.id,
        incidentKey: params.incidentKey,
        type: "priority_changed",
        actorUserId: params.actorUserId ?? null,
        metadataJson: {
          beforePriority: before,
          afterPriority: params.priority,
        },
      });
    });

    await this.automation.handleActionChanged({
      incidentKey: params.incidentKey,
    });

    return this.buildActionDetail(action.id);
  }

  async updateStatus(params: {
    incidentKey: string;
    status: SystemTestIncidentActionStatus;
    actorUserId?: string | null;
  }): Promise<SystemTestIncidentActionDetailDto> {
    const action = await this.ensureActionForIncidentKey({
      incidentKey: params.incidentKey,
      actorUserId: params.actorUserId,
    });

    if (action.status === params.status) {
      return this.buildActionDetail(action.id);
    }

    this.assertTransitionAllowed(action.status, params.status);

    const before = action.status;
    const nextResolvedAt =
      params.status === "resolved" ? new Date()
      : action.status === "resolved" ? null
      : action.resolvedAt;

    await this.prisma.$transaction(async (tx) => {
      await tx.systemTestIncidentAction.update({
        where: { id: action.id },
        data: {
          status: params.status,
          resolvedAt: nextResolvedAt,
        },
      });

      await this.createEvent(tx, {
        incidentActionId: action.id,
        incidentKey: params.incidentKey,
        type: "status_changed",
        actorUserId: params.actorUserId ?? null,
        metadataJson: {
          beforeStatus: before,
          afterStatus: params.status,
          reason: "manual",
        },
      });
    });

    await this.automation.handleActionChanged({
      incidentKey: params.incidentKey,
    });

    return this.buildActionDetail(action.id);
  }

  async addNote(params: {
    incidentKey: string;
    text: string;
    actorUserId?: string | null;
  }): Promise<SystemTestIncidentActionDetailDto> {
    const trimmed = params.text?.trim() ?? "";
    if (!trimmed) {
      throw new BadRequestException("NOTE_TEXT_REQUIRED");
    }

    const action = await this.ensureActionForIncidentKey({
      incidentKey: params.incidentKey,
      actorUserId: params.actorUserId,
    });

    const note = await this.prisma.$transaction(async (tx) => {
      const n = await tx.systemTestIncidentNote.create({
        data: {
          incidentActionId: action.id,
          incidentKey: params.incidentKey,
          userId: params.actorUserId ?? null,
          text: trimmed,
        },
      });

      await this.createEvent(tx, {
        incidentActionId: action.id,
        incidentKey: params.incidentKey,
        type: "note_added",
        actorUserId: params.actorUserId ?? null,
        metadataJson: { noteId: n.id },
      });

      return n;
    });

    void note;
    await this.automation.handleActionChanged({
      incidentKey: params.incidentKey,
    });
    return this.buildActionDetail(action.id);
  }

  async updateStepExecution(params: {
    incidentKey: string;
    stepIndex: number;
    status: SystemTestIncidentStepExecutionStatus;
    notes?: string | null;
    actorUserId?: string | null;
  }): Promise<SystemTestIncidentActionDetailDto> {
    const action = await this.ensureActionForIncidentKey({
      incidentKey: params.incidentKey,
      actorUserId: params.actorUserId,
    });

    const step = await this.prisma.systemTestIncidentStepExecution.findUnique({
      where: {
        incidentActionId_stepIndex: {
          incidentActionId: action.id,
          stepIndex: params.stepIndex,
        },
      },
    });

    if (!step) {
      throw new NotFoundException("SYSTEM_TEST_INCIDENT_STEP_NOT_FOUND");
    }

    await this.prisma.systemTestIncidentStepExecution.update({
      where: { id: step.id },
      data: {
        status: params.status,
        notes:
          params.notes === undefined ? undefined
          : params.notes === null ? null
          : params.notes,
      },
    });

    const refreshed = await this.prisma.systemTestIncidentAction.findUniqueOrThrow({
      where: { id: action.id },
      include: { stepExecutions: true },
    });

    let newStatus: SystemTestIncidentActionStatus | null = null;
    let autoReason: "first_step_in_progress" | "all_steps_completed" | null = null;

    if (
      params.stepIndex === 0 &&
      params.status === "in_progress" &&
      refreshed.status === "open"
    ) {
      newStatus = "fixing";
      autoReason = "first_step_in_progress";
    }

    const steps = refreshed.stepExecutions;
    const allDone =
      steps.length > 0 && steps.every((s) => s.status === "completed");
    if (
      allDone &&
      (refreshed.status === "fixing" || refreshed.status === "investigating")
    ) {
      newStatus = "validating";
      autoReason = "all_steps_completed";
    }

    if (newStatus && newStatus !== refreshed.status) {
      const before = refreshed.status;
      await this.prisma.$transaction(async (tx) => {
        await tx.systemTestIncidentAction.update({
          where: { id: action.id },
          data: { status: newStatus! },
        });

        await this.createEvent(tx, {
          incidentActionId: action.id,
          incidentKey: params.incidentKey,
          type: "status_changed",
          actorUserId: params.actorUserId ?? null,
          metadataJson: {
            beforeStatus: before,
            afterStatus: newStatus,
            reason:
              autoReason === "all_steps_completed" ?
                "all_steps_completed"
              : "first_step_in_progress",
          },
        });
      });
    }

    await this.automation.handleActionChanged({
      incidentKey: params.incidentKey,
    });

    return this.buildActionDetail(action.id);
  }
}
