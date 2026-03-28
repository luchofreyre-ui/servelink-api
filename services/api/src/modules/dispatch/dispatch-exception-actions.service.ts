import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  DispatchExceptionActionPriority,
  DispatchExceptionActionStatus,
  DispatchExceptionActionEventType,
  Prisma,
} from "@prisma/client";

import { PrismaService } from "../../prisma";
import type { AdminDispatchExceptionItemDto } from "./dto/admin-dispatch-exceptions.dto";
import { DispatchExceptionAutomationService } from "./dispatch-exception-automation.service";
import { buildDispatchExceptionKeyFromBookingId } from "./dispatch-exception-key";
import type {
  DispatchExceptionActionDetailDto,
  DispatchExceptionActionEventDto,
  DispatchExceptionActionListItemDto,
  DispatchExceptionActionNoteDto,
} from "./dto/dispatch-exception-actions.dto";

const PRIORITY_RANK: Record<DispatchExceptionActionPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const ALLOWED_STATUS_TRANSITIONS: Record<
  DispatchExceptionActionStatus,
  DispatchExceptionActionStatus[]
> = {
  open: ["investigating", "waiting", "dismissed", "resolved"],
  investigating: ["open", "waiting", "resolved", "dismissed"],
  waiting: ["investigating", "resolved", "dismissed"],
  resolved: ["investigating"],
  dismissed: ["open"],
};

function isResolvedLike(status: DispatchExceptionActionStatus): boolean {
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

function mapBucketToPriority(
  bucket: string,
): DispatchExceptionActionPriority {
  switch (bucket) {
    case "urgent":
      return "critical";
    case "high":
      return "high";
    case "low":
      return "low";
    default:
      return "medium";
  }
}

function readMeta(json: unknown): Record<string, unknown> {
  if (json && typeof json === "object" && !Array.isArray(json)) {
    return json as Record<string, unknown>;
  }
  return {};
}

type DbClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class DispatchExceptionActionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly automation: DispatchExceptionAutomationService,
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
    from: DispatchExceptionActionStatus,
    to: DispatchExceptionActionStatus,
  ): void {
    const allowed = ALLOWED_STATUS_TRANSITIONS[from];
    if (!allowed?.includes(to)) {
      throw new BadRequestException(`INVALID_STATUS_TRANSITION: ${from} → ${to}`);
    }
  }

  buildMetadataSnapshot(item: AdminDispatchExceptionItemDto): Record<string, unknown> {
    return {
      bookingId: item.bookingId,
      foId: item.latestSelectedFranchiseOwnerId,
      exceptionReasons: item.exceptionReasons,
      latestDecisionStatus: item.latestDecisionStatus,
      latestTrigger: item.latestTrigger,
      latestTriggerDetail: item.latestTriggerDetail,
      severity: item.severity,
      recommendedAction: item.recommendedAction,
      totalDispatchPasses: item.totalDispatchPasses,
      priorityBucket: item.priorityBucket,
      absentStreak: 0,
    };
  }

  async createEvent(
    tx: DbClient,
    params: {
      dispatchExceptionActionId: string;
      dispatchExceptionKey: string;
      type: DispatchExceptionActionEventType;
      actorUserId?: string | null;
      metadataJson?: Record<string, unknown> | null;
    },
  ): Promise<void> {
    await tx.dispatchExceptionActionEvent.create({
      data: {
        dispatchExceptionActionId: params.dispatchExceptionActionId,
        dispatchExceptionKey: params.dispatchExceptionKey,
        type: params.type,
        actorUserId: params.actorUserId ?? null,
        metadataJson:
          params.metadataJson === undefined ? undefined
          : params.metadataJson === null ? Prisma.JsonNull
          : (params.metadataJson as Prisma.InputJsonValue),
      },
    });
  }

  /**
   * Create or refresh action row from computed exception signal (lifecycle entry).
   */
  async bootstrapOrRefreshFromExceptionItem(
    item: AdminDispatchExceptionItemDto,
    actorUserId?: string | null,
  ): Promise<{ id: string; dispatchExceptionKey: string; created: boolean }> {
    const dispatchExceptionKey = buildDispatchExceptionKeyFromBookingId(
      item.bookingId,
    );
    const latestDecision = await this.prisma.dispatchDecision.findFirst({
      where: { bookingId: item.bookingId },
      orderBy: [{ createdAt: "desc" }, { dispatchSequence: "desc" }],
      select: { id: true },
    });
    const snapshot = this.buildMetadataSnapshot(item);
    const priority = mapBucketToPriority(item.priorityBucket);

    const existing = await this.prisma.dispatchExceptionAction.findUnique({
      where: { dispatchExceptionKey },
    });

    if (!existing) {
      const created = await this.prisma.$transaction(async (tx) => {
        const action = await tx.dispatchExceptionAction.create({
          data: {
            dispatchExceptionKey,
            status: "open",
            priority,
            lastSeenAt: new Date(),
            lastSeenExceptionId: latestDecision?.id ?? null,
            metadataJson: snapshot as Prisma.InputJsonValue,
          },
        });
        await this.createEvent(tx, {
          dispatchExceptionActionId: action.id,
          dispatchExceptionKey,
          type: "action_created",
          actorUserId: actorUserId ?? null,
          metadataJson: { bookingId: item.bookingId },
        });
        return action;
      });
      await this.automation.handleActionChanged({ dispatchExceptionKey });
      return {
        id: created.id,
        dispatchExceptionKey,
        created: true,
      };
    }

    const meta = readMeta(existing.metadataJson);
    const nextMeta = {
      ...meta,
      ...snapshot,
      absentStreak: 0,
    };

    const prevEx = existing.lastSeenExceptionId;
    const nextEx = latestDecision?.id ?? null;

    await this.prisma.$transaction(async (tx) => {
      await tx.dispatchExceptionAction.update({
        where: { id: existing.id },
        data: {
          lastSeenAt: new Date(),
          lastSeenExceptionId: nextEx,
          metadataJson: nextMeta as Prisma.InputJsonValue,
          priority:
            PRIORITY_RANK[priority] < PRIORITY_RANK[existing.priority] ?
              priority
            : existing.priority,
        },
      });

      if (prevEx !== nextEx && nextEx) {
        await this.createEvent(tx, {
          dispatchExceptionActionId: existing.id,
          dispatchExceptionKey,
          type: "exception_seen",
          actorUserId: actorUserId ?? null,
          metadataJson: {
            lastSeenExceptionId: nextEx,
            bookingId: item.bookingId,
          },
        });
      }
    });

    await this.automation.handleActionChanged({ dispatchExceptionKey });
    return {
      id: existing.id,
      dispatchExceptionKey,
      created: false,
    };
  }

  async getActionByKey(dispatchExceptionKey: string) {
    return this.prisma.dispatchExceptionAction.findUnique({
      where: { dispatchExceptionKey },
    });
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
  }): Promise<{ items: DispatchExceptionActionListItemDto[]; count: number }> {
    const limit = Math.min(Math.max(params.limit ?? 50, 1), 200);

    const statusFilter = this.coerceEnumArray<DispatchExceptionActionStatus>(
      params.status,
      ["open", "investigating", "waiting", "resolved", "dismissed"],
      "status",
    );
    const priorityFilter = this.coerceEnumArray<DispatchExceptionActionPriority>(
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

    const andParts: Prisma.DispatchExceptionActionWhereInput[] = [];

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
      andParts.push({
        dispatchExceptionKey: { contains: s, mode: "insensitive" },
      });
    }

    const where: Prisma.DispatchExceptionActionWhereInput =
      andParts.length ? { AND: andParts } : {};

    const rows = await this.prisma.dispatchExceptionAction.findMany({
      where,
      include: {
        owner: { select: { id: true, email: true } },
        _count: { select: { notes: true } },
      },
    });

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

    const items: DispatchExceptionActionListItemDto[] = sliced.map((row) => {
      const m = readMeta(row.metadataJson);
      const reasons = Array.isArray(m.exceptionReasons) ?
        m.exceptionReasons.filter((x): x is string => typeof x === "string")
      : [];

      return {
        dispatchExceptionKey: row.dispatchExceptionKey,
        bookingId: typeof m.bookingId === "string" ? m.bookingId : "",
        foId: typeof m.foId === "string" ? m.foId : null,
        status: row.status,
        priority: row.priority,
        ownerUserId: row.ownerUserId,
        ownerName: row.owner?.email ?? null,
        lastSeenAt: row.lastSeenAt?.toISOString() ?? null,
        lastSeenExceptionId: row.lastSeenExceptionId,
        resolvedAt: row.resolvedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        exceptionTitle:
          typeof m.bookingId === "string" ?
            `Dispatch exception · ${m.bookingId.slice(0, 8)}…`
          : null,
        exceptionSummary:
          typeof m.latestTriggerDetail === "string" ? m.latestTriggerDetail : null,
        exceptionReasons: reasons,
        latestDecisionStatus:
          typeof m.latestDecisionStatus === "string" ?
            m.latestDecisionStatus
          : null,
        severity: typeof m.severity === "string" ? m.severity : null,
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
  ): Promise<DispatchExceptionActionDetailDto> {
    const action = await this.prisma.dispatchExceptionAction.findUnique({
      where: { id: actionId },
      include: {
        owner: { select: { id: true, email: true } },
        notes: {
          orderBy: { createdAt: "asc" },
          include: { user: { select: { email: true } } },
        },
        events: {
          orderBy: { createdAt: "desc" },
          include: { actorUser: { select: { email: true } } },
        },
      },
    });

    if (!action) {
      throw new NotFoundException("DISPATCH_EXCEPTION_ACTION_NOT_FOUND");
    }

    const m = readMeta(action.metadataJson);
    const bookingId =
      typeof m.bookingId === "string" ? m.bookingId : "";
    const reasons = Array.isArray(m.exceptionReasons) ?
      m.exceptionReasons.filter((x): x is string => typeof x === "string")
    : [];

    const noteDtos: DispatchExceptionActionNoteDto[] = action.notes.map((n) => ({
      id: n.id,
      userId: n.userId,
      userName: n.user?.email ?? null,
      text: n.text,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    }));

    const eventDtos: DispatchExceptionActionEventDto[] = action.events.map(
      (e) => ({
        id: e.id,
        type: e.type,
        actorUserId: e.actorUserId,
        actorName: e.actorUser?.email ?? null,
        metadataJson:
          e.metadataJson === null || e.metadataJson === undefined ?
            null
          : (e.metadataJson as Record<string, unknown>),
        createdAt: e.createdAt.toISOString(),
      }),
    );

    const validationState = action.validationState ?? null;

    return {
      dispatchExceptionKey: action.dispatchExceptionKey,
      bookingId,
      foId: typeof m.foId === "string" ? m.foId : null,
      status: action.status,
      priority: action.priority,
      ownerUserId: action.ownerUserId,
      ownerName: action.owner?.email ?? null,
      lastSeenAt: action.lastSeenAt?.toISOString() ?? null,
      lastSeenExceptionId: action.lastSeenExceptionId,
      resolvedAt: action.resolvedAt?.toISOString() ?? null,
      createdAt: action.createdAt.toISOString(),
      updatedAt: action.updatedAt.toISOString(),
      exceptionTitle:
        bookingId ? `Dispatch exception · ${bookingId.slice(0, 8)}…` : null,
      exceptionSummary:
        typeof m.latestTriggerDetail === "string" ? m.latestTriggerDetail : null,
      exceptionReasons: reasons,
      latestDecisionStatus:
        typeof m.latestDecisionStatus === "string" ?
          m.latestDecisionStatus
        : null,
      latestTrigger: typeof m.latestTrigger === "string" ? m.latestTrigger : null,
      latestTriggerDetail:
        typeof m.latestTriggerDetail === "string" ?
          m.latestTriggerDetail
        : null,
      recommendedAction:
        typeof m.recommendedAction === "string" ? m.recommendedAction : null,
      severity: typeof m.severity === "string" ? m.severity : null,
      metadataSnapshot: m,
      notes: noteDtos,
      events: eventDtos,
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
    };
  }

  async getActionDetail(
    dispatchExceptionKey: string,
  ): Promise<DispatchExceptionActionDetailDto> {
    const action = await this.prisma.dispatchExceptionAction.findUnique({
      where: { dispatchExceptionKey },
    });
    if (!action) {
      throw new NotFoundException("DISPATCH_EXCEPTION_ACTION_NOT_FOUND");
    }
    return this.buildActionDetail(action.id);
  }

  async updateOwner(params: {
    dispatchExceptionKey: string;
    ownerUserId: string | null;
    actorUserId?: string | null;
  }): Promise<DispatchExceptionActionDetailDto> {
    const action = await this.prisma.dispatchExceptionAction.findUnique({
      where: { dispatchExceptionKey: params.dispatchExceptionKey },
    });
    if (!action) {
      throw new NotFoundException("DISPATCH_EXCEPTION_ACTION_NOT_FOUND");
    }

    if (params.ownerUserId) {
      const user = await this.prisma.user.findUnique({
        where: { id: params.ownerUserId },
      });
      if (!user) throw new NotFoundException("USER_NOT_FOUND");
    }

    if (action.ownerUserId === params.ownerUserId) {
      return this.buildActionDetail(action.id);
    }

    const before = action.ownerUserId;

    await this.prisma.$transaction(async (tx) => {
      await tx.dispatchExceptionAction.update({
        where: { id: action.id },
        data: {
          ownerUserId: params.ownerUserId,
          ...(params.ownerUserId ? { lastNotificationQueuedAt: null } : {}),
        },
      });

      await this.createEvent(tx, {
        dispatchExceptionActionId: action.id,
        dispatchExceptionKey: params.dispatchExceptionKey,
        type: params.ownerUserId ? "assigned" : "unassigned",
        actorUserId: params.actorUserId ?? null,
        metadataJson: {
          beforeOwnerUserId: before,
          afterOwnerUserId: params.ownerUserId,
        },
      });
    });

    await this.automation.handleActionChanged({
      dispatchExceptionKey: params.dispatchExceptionKey,
    });
    return this.buildActionDetail(action.id);
  }

  async assignToMe(params: {
    dispatchExceptionKey: string;
    actorUserId: string;
  }): Promise<DispatchExceptionActionDetailDto> {
    return this.updateOwner({
      dispatchExceptionKey: params.dispatchExceptionKey,
      ownerUserId: params.actorUserId,
      actorUserId: params.actorUserId,
    });
  }

  async updatePriority(params: {
    dispatchExceptionKey: string;
    priority: DispatchExceptionActionPriority;
    actorUserId?: string | null;
  }): Promise<DispatchExceptionActionDetailDto> {
    const action = await this.prisma.dispatchExceptionAction.findUnique({
      where: { dispatchExceptionKey: params.dispatchExceptionKey },
    });
    if (!action) throw new NotFoundException("DISPATCH_EXCEPTION_ACTION_NOT_FOUND");

    if (action.priority === params.priority) {
      return this.buildActionDetail(action.id);
    }

    const before = action.priority;

    await this.prisma.$transaction(async (tx) => {
      await tx.dispatchExceptionAction.update({
        where: { id: action.id },
        data: { priority: params.priority },
      });
      await this.createEvent(tx, {
        dispatchExceptionActionId: action.id,
        dispatchExceptionKey: params.dispatchExceptionKey,
        type: "priority_changed",
        actorUserId: params.actorUserId ?? null,
        metadataJson: {
          beforePriority: before,
          afterPriority: params.priority,
        },
      });
    });

    await this.automation.handleActionChanged({
      dispatchExceptionKey: params.dispatchExceptionKey,
    });
    return this.buildActionDetail(action.id);
  }

  async updateStatus(params: {
    dispatchExceptionKey: string;
    status: DispatchExceptionActionStatus;
    actorUserId?: string | null;
  }): Promise<DispatchExceptionActionDetailDto> {
    const action = await this.prisma.dispatchExceptionAction.findUnique({
      where: { dispatchExceptionKey: params.dispatchExceptionKey },
    });
    if (!action) throw new NotFoundException("DISPATCH_EXCEPTION_ACTION_NOT_FOUND");

    if (action.status === params.status) {
      return this.buildActionDetail(action.id);
    }

    this.assertTransitionAllowed(action.status, params.status);

    const before = action.status;
    const nextResolvedAt =
      params.status === "resolved" ? new Date()
      : action.status === "resolved" ? null
      : action.resolvedAt;

    const validationPatch: Prisma.DispatchExceptionActionUpdateInput =
      params.status === "resolved" ?
        {
          validationState: "pending",
          validationLastPassedAt: null,
          validationLastFailedAt: null,
        }
      : {};

    await this.prisma.$transaction(async (tx) => {
      await tx.dispatchExceptionAction.update({
        where: { id: action.id },
        data: {
          status: params.status,
          resolvedAt: nextResolvedAt,
          ...validationPatch,
        },
      });

      await this.createEvent(tx, {
        dispatchExceptionActionId: action.id,
        dispatchExceptionKey: params.dispatchExceptionKey,
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
      dispatchExceptionKey: params.dispatchExceptionKey,
    });
    return this.buildActionDetail(action.id);
  }

  async addNote(params: {
    dispatchExceptionKey: string;
    text: string;
    actorUserId?: string | null;
  }): Promise<DispatchExceptionActionDetailDto> {
    const trimmed = params.text?.trim() ?? "";
    if (!trimmed) throw new BadRequestException("NOTE_TEXT_REQUIRED");

    const action = await this.prisma.dispatchExceptionAction.findUnique({
      where: { dispatchExceptionKey: params.dispatchExceptionKey },
    });
    if (!action) throw new NotFoundException("DISPATCH_EXCEPTION_ACTION_NOT_FOUND");

    await this.prisma.$transaction(async (tx) => {
      const n = await tx.dispatchExceptionActionNote.create({
        data: {
          dispatchExceptionActionId: action.id,
          dispatchExceptionKey: params.dispatchExceptionKey,
          userId: params.actorUserId ?? null,
          text: trimmed,
        },
      });
      await this.createEvent(tx, {
        dispatchExceptionActionId: action.id,
        dispatchExceptionKey: params.dispatchExceptionKey,
        type: "note_added",
        actorUserId: params.actorUserId ?? null,
        metadataJson: { noteId: n.id },
      });
    });

    await this.automation.handleActionChanged({
      dispatchExceptionKey: params.dispatchExceptionKey,
    });
    return this.buildActionDetail(action.id);
  }

  async transitionStatusInternal(params: {
    dispatchExceptionKey: string;
    nextStatus: DispatchExceptionActionStatus;
    actorUserId?: string | null;
    reason: string;
    skipTransitionValidation?: boolean;
    clearResolvedAt?: boolean;
    setResolvedAtNow?: boolean;
    extraPatch?: Prisma.DispatchExceptionActionUpdateInput;
    tx?: Prisma.TransactionClient;
  }): Promise<void> {
    const run = async (tx: DbClient) => {
      const row = await tx.dispatchExceptionAction.findUnique({
        where: { dispatchExceptionKey: params.dispatchExceptionKey },
      });
      if (!row) throw new NotFoundException("DISPATCH_EXCEPTION_ACTION_NOT_FOUND");
      if (!params.skipTransitionValidation) {
        this.assertTransitionAllowed(row.status, params.nextStatus);
      }

      let resolvedAt: Date | null | undefined = undefined;
      if (params.clearResolvedAt) resolvedAt = null;
      else if (params.setResolvedAtNow) resolvedAt = new Date();
      else if (params.nextStatus === "resolved" && row.status !== "resolved") {
        resolvedAt = new Date();
      } else if (row.status === "resolved" && params.nextStatus !== "resolved") {
        resolvedAt = null;
      }

      await tx.dispatchExceptionAction.update({
        where: { id: row.id },
        data: {
          status: params.nextStatus,
          ...(resolvedAt !== undefined ? { resolvedAt } : {}),
          ...(params.extraPatch ?? {}),
        },
      });

      await this.createEvent(tx, {
        dispatchExceptionActionId: row.id,
        dispatchExceptionKey: params.dispatchExceptionKey,
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

  async setValidationState(params: {
    dispatchExceptionKey: string;
    validationState: "pending" | "passed" | "failed";
    checkedAt?: Date;
    passedAt?: Date | null;
    failedAt?: Date | null;
    reopenedAt?: Date | null;
    incrementReopenCount?: boolean;
    tx?: Prisma.TransactionClient;
  }): Promise<void> {
    const data: Prisma.DispatchExceptionActionUpdateInput = {
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
      await tx.dispatchExceptionAction.update({
        where: { dispatchExceptionKey: params.dispatchExceptionKey },
        data,
      });
    };

    if (params.tx) {
      await apply(params.tx);
    } else {
      await this.prisma.$transaction(async (tx) => apply(tx));
    }
  }
}
