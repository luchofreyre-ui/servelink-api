import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { BookingStatus, Prisma, PrismaClient } from "@prisma/client";

import { PrismaService } from "../../prisma";
import {
  RecordDispatchDecisionInput,
  DispatchDecisionCandidateInput,
} from "./types/dispatch-decision.types";
import type {
  AdminDispatchTimelineDto,
  AdminDispatchTimelineDecisionDto,
  AdminDispatchTimelineCandidateDto,
} from "../dispatch/dto/admin-dispatch-timeline.dto";
import type {
  AdminDispatchExceptionsResponseDto,
  AdminDispatchExceptionItemDto,
  AdminDispatchExceptionsSortBy,
  AdminDispatchPriorityBucket,
  AdminDispatchRecommendedAction,
  AdminDispatchSeverity,
  DispatchExceptionType,
} from "../dispatch/dto/admin-dispatch-exceptions.dto";
import type { AdminDispatchExceptionDetailDto } from "../dispatch/dto/admin-dispatch-exception-detail.dto";
import type {
  DispatchExplainerResponseDto,
  DispatchExplainerCandidateDto,
} from "../dispatch/dto/dispatch-explainer.dto";

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

@Injectable()
export class DispatchDecisionService {
  private static readonly DECIMAL_FIELDS: Array<keyof DispatchDecisionCandidateInput> = [
    "baseScore",
    "finalScore",
    "distanceMiles",
    "acceptanceRate",
    "completionRate",
    "cancellationRate",
    "acceptancePenalty",
    "completionPenalty",
    "cancellationPenalty",
    "loadPenalty",
    "reliabilityBonus",
    "finalPenalty",
  ];

  constructor(private readonly prisma: PrismaService) {}

  async getDispatchExplainer(
    bookingId: string,
  ): Promise<DispatchExplainerResponseDto> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        scheduledStart: true,
        foId: true,
      },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    const latestDecision = await this.prisma.dispatchDecision.findFirst({
      where: { bookingId },
      include: { candidates: true },
      orderBy: [{ dispatchSequence: "desc" }, { createdAt: "desc" }],
    });

    const notes = await this.prisma.dispatchOperatorNote.findMany({
      where: { bookingId },
      orderBy: { createdAt: "asc" },
    });

    const configVersion = latestDecision
      ? this.parseConfigVersionFromScoringVersion(latestDecision.scoringVersion)
      : null;

    if (!latestDecision) {
      return {
        booking: {
          id: booking.id,
          status: booking.status,
          scheduledStart: booking.scheduledStart?.toISOString() ?? null,
          foId: booking.foId ?? null,
        },
        scoringVersion: "",
        configVersion: null,
        selectedCandidateId: null,
        selectedFoId: null,
        dispatchSequence: null,
        trigger: null,
        summary:
          "No dispatch decision history is available for this booking.",
        candidates: [],
        notes: notes.map((n) => n.note),
      };
    }

    const selectedFoId = latestDecision.selectedFranchiseOwnerId ?? null;
    const candidates = this.buildExplainerCandidates(
      latestDecision.candidates,
      selectedFoId,
      latestDecision.decisionStatus,
    );
    const summary = this.buildDispatchExplainerSummary(
      latestDecision.decisionStatus,
      selectedFoId,
      candidates,
    );

    return {
      booking: {
        id: booking.id,
        status: booking.status,
        scheduledStart: booking.scheduledStart?.toISOString() ?? null,
        foId: booking.foId ?? null,
      },
      scoringVersion: latestDecision.scoringVersion,
      configVersion,
      selectedCandidateId: null,
      selectedFoId,
      dispatchSequence: latestDecision.dispatchSequence,
      trigger: latestDecision.trigger ?? null,
      summary,
      candidates,
      notes: notes.map((n) => n.note),
    };
  }

  private parseConfigVersionFromScoringVersion(scoringVersion: string): number | null {
    const match = /^dispatch-config-v(\d+)$/i.exec(scoringVersion);
    return match ? parseInt(match[1], 10) : null;
  }

  private buildExplainerCandidates(
    candidates: Array<{
      id: string;
      franchiseOwnerId: string;
      candidateStatus: string;
      baseRank: number | null;
      finalRank: number | null;
      baseScore: Prisma.Decimal | null;
      finalScore: Prisma.Decimal | null;
      loadPenalty: Prisma.Decimal | null;
      acceptancePenalty: Prisma.Decimal | null;
      completionPenalty: Prisma.Decimal | null;
      cancellationPenalty: Prisma.Decimal | null;
      reliabilityBonus: Prisma.Decimal | null;
      reasonCode: string | null;
      reasonDetail: string | null;
    }>,
    selectedFoId: string | null,
    decisionStatus: string,
  ): DispatchExplainerCandidateDto[] {
    const sorted = [...candidates].sort((a, b) =>
      this.compareCandidates(a as any, b as any),
    );
    const effectiveRanks = sorted
      .filter((c) => c.candidateStatus !== "excluded")
      .map((c) => c.finalRank ?? c.baseRank ?? Infinity);
    const minEffectiveRank =
      effectiveRanks.length === 0
        ? Infinity
        : Math.min(...effectiveRanks);

    return sorted.map((c) => {
      const excluded = c.candidateStatus === "excluded";
      const selected = c.franchiseOwnerId === selectedFoId && c.candidateStatus === "selected";
      const loadPenalty = c.loadPenalty != null ? Number(c.loadPenalty) : 0;
      const acceptancePenalty = c.acceptancePenalty != null ? Number(c.acceptancePenalty) : 0;
      const completionPenalty = c.completionPenalty != null ? Number(c.completionPenalty) : 0;
      const cancellationPenalty =
        c.cancellationPenalty != null ? Number(c.cancellationPenalty) : 0;
      const reliabilityBonus = c.reliabilityBonus != null ? Number(c.reliabilityBonus) : 0;
      const effectiveRank = c.finalRank ?? c.baseRank ?? null;
      const explanation = this.buildCandidateExplanation({
        candidate: c,
        excluded,
        selected,
        loadPenalty,
        acceptancePenalty,
        completionPenalty,
        cancellationPenalty,
        reliabilityBonus,
        effectiveRank,
        minEffectiveRank,
        isLowestRank:
          effectiveRank != null &&
          !excluded &&
          effectiveRank === minEffectiveRank,
      });
      return {
        providerId: null,
        foId: c.franchiseOwnerId,
        baseRank: c.baseRank ?? null,
        effectiveRank,
        selected,
        excluded,
        exclusionReason: excluded ? c.reasonDetail ?? c.reasonCode ?? null : null,
        factors: {
          loadPenalty,
          acceptancePenalty,
          completionPenalty,
          cancellationPenalty,
          reliabilityBonus,
          responseSpeedAdjustment: 0,
          multiPassPenalty: 0,
        },
        explanation,
      };
    });
  }

  private buildCandidateExplanation(args: {
    candidate: { reasonCode: string | null; candidateStatus: string };
    excluded: boolean;
    selected: boolean;
    loadPenalty: number;
    acceptancePenalty: number;
    completionPenalty: number;
    cancellationPenalty: number;
    reliabilityBonus: number;
    effectiveRank: number | null;
    minEffectiveRank: number;
    isLowestRank: boolean;
  }): string[] {
    const lines: string[] = [];
    if (args.excluded) {
      if (args.candidate.reasonCode === "excluded_manual_block") {
        lines.push("Excluded from selection due to manual block.");
      } else {
        lines.push(
          args.candidate.reasonCode
            ? `Excluded: ${args.candidate.reasonCode}`
            : "Excluded from selection.",
        );
      }
      return lines;
    }
    if (args.isLowestRank && args.selected) {
      lines.push("Lowest effective rank among eligible candidates.");
    }
    if (args.loadPenalty > 0) {
      lines.push("Penalized by current load.");
    }
    if (args.acceptancePenalty > 0) {
      lines.push("Penalized by low acceptance history.");
    }
    if (args.completionPenalty > 0) {
      lines.push("Penalized by completion history.");
    }
    if (args.cancellationPenalty > 0) {
      lines.push("Penalized by cancellation history.");
    }
    if (args.reliabilityBonus > 0) {
      lines.push("Boosted by reliability performance.");
    }
    if (lines.length === 0 && args.selected) {
      lines.push("Selected as best eligible candidate.");
    }
    return lines;
  }

  private buildDispatchExplainerSummary(
    decisionStatus: string,
    selectedFoId: string | null,
    candidates: DispatchExplainerCandidateDto[],
  ): string {
    if (decisionStatus === "selected" && selectedFoId) {
      const selectedCandidate = candidates.find((c) => c.foId === selectedFoId && c.selected);
      const label = selectedCandidate?.foId ?? "Cleaner";
      return `${label} was selected because it had the best effective rank among eligible candidates.`;
    }
    if (decisionStatus === "all_excluded") {
      return "No provider was selected because all candidates were excluded.";
    }
    if (decisionStatus === "no_candidates") {
      return "No provider was selected because no candidates were available.";
    }
    return "No provider was selected for this dispatch pass.";
  }

  async getBookingDispatchTimeline(
    bookingId: string,
  ): Promise<AdminDispatchTimelineDto> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        scheduledStart: true,
        estimatedHours: true,
      },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    const decisions = await this.prisma.dispatchDecision.findMany({
      where: { bookingId },
      include: {
        candidates: true,
      },
      orderBy: [{ dispatchSequence: "asc" }, { createdAt: "asc" }],
    });

    const mapped = decisions.map((decision) => this.mapDecision(decision));

    return {
      bookingId: booking.id,
      bookingStatus: booking.status ?? null,
      scheduledStart: booking.scheduledStart?.toISOString() ?? null,
      estimatedDurationMin:
        booking.estimatedHours != null
          ? Math.round(booking.estimatedHours * 60)
          : null,
      totalDispatchPasses: mapped.length,
      decisions: mapped,
    };
  }

  async getDispatchExceptions(args: {
    type?: DispatchExceptionType;
    bookingStatus?: string | null;
    minDispatchPasses?: number;
    limit?: number;
    cursor?: string | null;
    sortBy?: AdminDispatchExceptionsSortBy;
    sortOrder?: "asc" | "desc";
    requiresFollowUp?: boolean;
    priorityBucket?: string | null;
    /** Called after filters + sort, before pagination slice (full filtered set). */
    onFiltered?: (
      items: AdminDispatchExceptionItemDto[],
    ) => void | Promise<void>;
  }): Promise<AdminDispatchExceptionsResponseDto> {
    const type: DispatchExceptionType = args.type ?? "all";
    const minDispatchPasses = Math.max(args.minDispatchPasses ?? 3, 1);
    const limit = Math.min(Math.max(args.limit ?? 25, 1), 100);
    const sortBy = this.clampExceptionsSortBy(args.sortBy ?? "priority");
    const sortOrder = args.sortOrder === "asc" ? "asc" : "desc";
    const requiresFollowUpFilter = args.requiresFollowUp === true;
    const priorityBucketFilter = args.priorityBucket
      ? args.priorityBucket.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
      : null;

    const now = new Date();
    // Split by "future vs non-future" to prevent anomalous future timestamps from crowding out
    // the most relevant non-future evidence when classifying exceptions.
    const [decisionsNonFuture, decisionsFuture] = await Promise.all([
      this.prisma.dispatchDecision.findMany({
        where: { createdAt: { lte: now } },
        orderBy: [{ createdAt: "desc" }, { dispatchSequence: "desc" }],
        // The API returns only `limit` items but needs enough decision evidence to classify them.
        take: limit * 2000,
        select: {
          id: true,
          bookingId: true,
          decisionStatus: true,
          trigger: true,
          triggerDetail: true,
          createdAt: true,
          dispatchSequence: true,
          selectedFranchiseOwnerId: true,
          decisionMeta: true,
        },
      }),
      this.prisma.dispatchDecision.findMany({
        where: { createdAt: { gt: now } },
        orderBy: [{ createdAt: "desc" }, { dispatchSequence: "desc" }],
        take: limit * 2000,
        select: {
          id: true,
          bookingId: true,
          decisionStatus: true,
          trigger: true,
          triggerDetail: true,
          createdAt: true,
          dispatchSequence: true,
          selectedFranchiseOwnerId: true,
          decisionMeta: true,
        },
      }),
    ]);

    const decisions = [...decisionsNonFuture, ...decisionsFuture].sort(
      (a, b) => {
        const dt = b.createdAt.getTime() - a.createdAt.getTime();
        if (dt !== 0) return dt;
        return b.dispatchSequence - a.dispatchSequence;
      },
    );

    const byBookingId = new Map<
      string,
      {
        decisions: Array<{
          decisionStatus: string;
          trigger: string;
          triggerDetail: string | null;
          createdAt: Date;
          selectedFranchiseOwnerId: string | null;
          decisionMeta: unknown;
        }>;
      }
    >();

    for (const d of decisions) {
      let agg = byBookingId.get(d.bookingId);
      if (!agg) {
        agg = { decisions: [] };
        byBookingId.set(d.bookingId, agg);
      }
      agg.decisions.push({
        decisionStatus: d.decisionStatus,
        trigger: d.trigger,
        triggerDetail: d.triggerDetail,
        createdAt: d.createdAt,
        selectedFranchiseOwnerId: d.selectedFranchiseOwnerId,
        decisionMeta: d.decisionMeta,
      });
    }

    const bookingIdsWithReasons: string[] = [];
    const aggregates = new Map<
      string,
      {
        totalDispatchPasses: number;
        selectedDecisionCount: number;
        noCandidatesCount: number;
        allExcludedCount: number;
        latestDecisionStatus: string | null;
        latestTrigger: string | null;
        latestTriggerDetail: string | null;
        latestCreatedAt: Date | null;
        latestSelectedFranchiseOwnerId: string | null;
        exceptionReasons: string[];
      }
    >();

    for (const [bookingId, agg] of byBookingId) {
      const totalDispatchPasses = agg.decisions.length;
      const selectedDecisionCount = agg.decisions.filter(
        (d) => d.decisionStatus === "selected",
      ).length;
      const noCandidatesCount = agg.decisions.filter(
        (d) => d.decisionStatus === "no_candidates",
      ).length;
      const allExcludedCount = agg.decisions.filter(
        (d) => d.decisionStatus === "all_excluded",
      ).length;
      const latest = agg.decisions[0] ?? null;
      const exceptionReasons = this.buildExceptionReasons({
        latestDecisionStatus: latest?.decisionStatus ?? null,
        totalDispatchPasses,
        selectedDecisionCount,
        minDispatchPasses,
      });

      const matchesType =
        type === "all"
          ? exceptionReasons.length > 0
          : exceptionReasons.includes(type);

      if (matchesType) {
        bookingIdsWithReasons.push(bookingId);
        aggregates.set(bookingId, {
          totalDispatchPasses,
          selectedDecisionCount,
          noCandidatesCount,
          allExcludedCount,
          latestDecisionStatus: latest?.decisionStatus ?? null,
          latestTrigger: latest?.trigger ?? null,
          latestTriggerDetail: latest?.triggerDetail ?? null,
          latestCreatedAt: latest?.createdAt ?? null,
          latestSelectedFranchiseOwnerId: latest?.selectedFranchiseOwnerId ?? null,
          exceptionReasons,
        });
      }
    }

    if (bookingIdsWithReasons.length === 0) {
      return { items: [], nextCursor: null, totalCount: 0 };
    }

    const whereBooking: Prisma.BookingWhereInput = {
      id: { in: bookingIdsWithReasons },
      ...(args.bookingStatus
        ? { status: args.bookingStatus as BookingStatus }
        : {}),
    };

    const bookings = await this.prisma.booking.findMany({
      where: whereBooking,
      select: {
        id: true,
        status: true,
        scheduledStart: true,
        estimatedHours: true,
      },
    });

    const aggMap = aggregates;
    const byBookingIdForManual = byBookingId;
    const items: AdminDispatchExceptionItemDto[] = bookings.map((b) => {
      const agg = aggMap.get(b.id)!;
      const bookingDecisions = byBookingIdForManual.get(b.id)?.decisions ?? [];
      const manualDecisions = bookingDecisions.filter((d) =>
        this.isManualTrigger(d.trigger),
      );
      const latestManualDecision =
        manualDecisions.length > 0 ? manualDecisions[0] : null;
      const hasManualIntervention = manualDecisions.length > 0;
      const latestManualActionAt = latestManualDecision?.createdAt?.toISOString() ?? null;
      const latestManualActionBy = latestManualDecision
        ? this.getAdminIdFromDecisionMeta(latestManualDecision.decisionMeta)
        : null;

      const actionPlan = this.getExceptionActionPlan({
        exceptionReasons: agg.exceptionReasons,
        totalDispatchPasses: agg.totalDispatchPasses,
        hasManualIntervention,
      });

      const priority = this.getExceptionPriority({
        severity: actionPlan.severity,
        scheduledStart: b.scheduledStart,
        hasManualIntervention,
        totalDispatchPasses: agg.totalDispatchPasses,
      });

      let staleSince: string | null = null;
      let requiresFollowUp = false;
      if (hasManualIntervention && latestManualDecision?.createdAt) {
        const manualAtMs = latestManualDecision.createdAt.getTime();
        const staleThresholdMs =
          manualAtMs +
          DispatchDecisionService.STALE_FOLLOW_UP_MINUTES * 60 * 1000;
        if (Date.now() > staleThresholdMs) {
          requiresFollowUp = true;
          staleSince = new Date(staleThresholdMs).toISOString();
        }
      }

      return {
        bookingId: b.id,
        bookingStatus: b.status ?? null,
        scheduledStart: b.scheduledStart?.toISOString() ?? null,
        estimatedDurationMin:
          b.estimatedHours != null ? Math.round(b.estimatedHours * 60) : null,
        latestDecisionStatus: agg.latestDecisionStatus,
        latestTrigger: agg.latestTrigger,
        latestTriggerDetail: agg.latestTriggerDetail,
        latestCreatedAt: agg.latestCreatedAt?.toISOString() ?? null,
        totalDispatchPasses: agg.totalDispatchPasses,
        selectedDecisionCount: agg.selectedDecisionCount,
        noCandidatesCount: agg.noCandidatesCount,
        allExcludedCount: agg.allExcludedCount,
        exceptionReasons: agg.exceptionReasons,
        latestSelectedFranchiseOwnerId: agg.latestSelectedFranchiseOwnerId,
        hasManualIntervention,
        latestManualActionAt,
        latestManualActionBy,
        severity: actionPlan.severity,
        recommendedAction: actionPlan.recommendedAction,
        availableActions: actionPlan.availableActions,
        priorityScore: priority.priorityScore,
        priorityBucket: priority.priorityBucket,
        staleSince,
        requiresFollowUp,
        detailPath: `/api/v1/admin/bookings/${b.id}/dispatch-exception-detail`,
      };
    });

    let filtered = items;
    if (requiresFollowUpFilter) {
      filtered = filtered.filter((i) => i.requiresFollowUp);
    }
    if (priorityBucketFilter && priorityBucketFilter.length > 0) {
      const set = new Set(priorityBucketFilter);
      filtered = filtered.filter((i) => set.has(i.priorityBucket));
    }

    const compare = this.buildExceptionsSortCompare(sortBy, sortOrder);
    filtered.sort(compare);

    if (args.onFiltered) {
      await args.onFiltered(filtered);
    }

    const capped = filtered.slice(0, limit);
    // v1: cursor-based pagination not implemented for exceptions; use nextCursor: null
    const nextCursor: string | null = null;

    return {
      items: capped,
      nextCursor,
      totalCount: capped.length,
    };
  }

  private clampExceptionsSortBy(
    value: string | undefined,
  ): AdminDispatchExceptionsSortBy {
    const allowed: AdminDispatchExceptionsSortBy[] = [
      "priority",
      "lastDecisionAt",
      "scheduledStart",
      "createdAt",
    ];
    return allowed.includes(value as AdminDispatchExceptionsSortBy)
      ? (value as AdminDispatchExceptionsSortBy)
      : "priority";
  }

  private buildExceptionsSortCompare(
    sortBy: AdminDispatchExceptionsSortBy,
    sortOrder: "asc" | "desc",
  ): (a: AdminDispatchExceptionItemDto, b: AdminDispatchExceptionItemDto) => number {
    const mult = sortOrder === "asc" ? 1 : -1;
    return (a, b) => {
      switch (sortBy) {
        case "priority":
          return mult * (b.priorityScore - a.priorityScore);
        case "lastDecisionAt": {
          const now = Date.now();
          const taRaw = a.latestCreatedAt
            ? new Date(a.latestCreatedAt).getTime()
            : 0;
          const tbRaw = b.latestCreatedAt
            ? new Date(b.latestCreatedAt).getTime()
            : 0;
          // Guardrail: anomalous future timestamps should not dominate admin ordering.
          // We clamp them to "now" (so they tie with real now decisions), then
          // prefer non-future rows in tie-breaks to keep non-anomalous records visible.
          const ta = taRaw > now ? now : taRaw;
          const tb = tbRaw > now ? now : tbRaw;
          const diff = ta - tb;
          if (diff !== 0) return mult * diff;

          const aIsFuture = taRaw > now;
          const bIsFuture = tbRaw > now;
          if (aIsFuture !== bIsFuture) {
            // For descending ordering, non-future should come first.
            return aIsFuture ? 1 : -1;
          }

          // Deterministic tie-break.
          return mult * a.bookingId.localeCompare(b.bookingId);
        }
        case "scheduledStart": {
          const sa = a.scheduledStart
            ? new Date(a.scheduledStart).getTime()
            : Number.MAX_SAFE_INTEGER;
          const sb = b.scheduledStart
            ? new Date(b.scheduledStart).getTime()
            : Number.MAX_SAFE_INTEGER;
          return mult * (sa - sb);
        }
        case "createdAt":
          return mult * (a.bookingId.localeCompare(b.bookingId));
        default:
          return mult * (b.priorityScore - a.priorityScore);
      }
    };
  }

  async addOperatorNote(args: {
    bookingId: string;
    adminUserId?: string | null;
    note: string;
  }) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: args.bookingId },
      select: { id: true },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    const trimmed = args.note.trim();
    if (!trimmed) {
      throw new BadRequestException("Note is required");
    }

    return this.prisma.dispatchOperatorNote.create({
      data: {
        bookingId: args.bookingId,
        adminUserId: args.adminUserId ?? null,
        note: trimmed,
      },
    });
  }

  async getDispatchExceptionDetail(
    bookingId: string,
  ): Promise<AdminDispatchExceptionDetailDto> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        scheduledStart: true,
        estimatedHours: true,
      },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    const decisions = await this.prisma.dispatchDecision.findMany({
      where: { bookingId },
      include: {
        candidates: true,
      },
      orderBy: [{ dispatchSequence: "asc" }, { createdAt: "asc" }],
    });

    const notes = await this.prisma.dispatchOperatorNote.findMany({
      where: { bookingId },
      orderBy: [{ createdAt: "asc" }],
    });

    const totalDispatchPasses = decisions.length;
    const selectedDecisionCount = decisions.filter(
      (d) => d.decisionStatus === "selected",
    ).length;
    const noCandidatesCount = decisions.filter(
      (d) => d.decisionStatus === "no_candidates",
    ).length;
    const allExcludedCount = decisions.filter(
      (d) => d.decisionStatus === "all_excluded",
    ).length;
    const latestDecision =
      decisions.length > 0 ? decisions[decisions.length - 1] : null;

    const exceptionReasons = this.buildExceptionReasons({
      latestDecisionStatus: latestDecision?.decisionStatus ?? null,
      totalDispatchPasses,
      selectedDecisionCount,
      minDispatchPasses: 3,
    });

    const manualDecisions = decisions.filter((d) =>
      this.isManualTrigger(d.trigger),
    );
    const latestManualDecision =
      manualDecisions.length > 0
        ? manualDecisions[manualDecisions.length - 1]
        : null;

    return {
      bookingId: booking.id,
      bookingStatus: booking.status ?? null,
      scheduledStart: booking.scheduledStart?.toISOString() ?? null,
      estimatedDurationMin:
        booking.estimatedHours != null
          ? Math.round(booking.estimatedHours * 60)
          : null,

      latestDecisionStatus: latestDecision?.decisionStatus ?? null,
      latestTrigger: latestDecision?.trigger ?? null,
      latestTriggerDetail: latestDecision?.triggerDetail ?? null,
      latestCreatedAt: latestDecision?.createdAt.toISOString() ?? null,

      totalDispatchPasses,
      selectedDecisionCount,
      noCandidatesCount,
      allExcludedCount,

      exceptionReasons,
      latestSelectedFranchiseOwnerId:
        latestDecision?.selectedFranchiseOwnerId ?? null,

      hasManualIntervention: manualDecisions.length > 0,
      latestManualActionAt: latestManualDecision?.createdAt.toISOString() ?? null,
      latestManualActionBy: latestManualDecision
        ? this.getAdminIdFromDecisionMeta(latestManualDecision.decisionMeta)
        : null,

      notes: notes.map((note) => ({
        id: note.id,
        bookingId: note.bookingId,
        adminUserId: note.adminUserId ?? null,
        note: note.note,
        createdAt: note.createdAt.toISOString(),
      })),

      decisions: decisions.map((decision) => this.mapDecision(decision)),
    };
  }

  private isManualTrigger(trigger: string | null | undefined): boolean {
    return (
      trigger === "redispatch_manual" ||
      trigger === "manual_assign" ||
      trigger === "manual_exclusion"
    );
  }

  private getAdminIdFromDecisionMeta(meta: unknown): string | null {
    if (!meta || typeof meta !== "object" || Array.isArray(meta)) {
      return null;
    }

    const maybeAdminId = (meta as Record<string, unknown>).adminId;
    return typeof maybeAdminId === "string" ? maybeAdminId : null;
  }

  private static readonly STALE_FOLLOW_UP_MINUTES = 30;

  private getExceptionPriority(args: {
    severity: AdminDispatchSeverity;
    scheduledStart: Date | null;
    hasManualIntervention: boolean;
    totalDispatchPasses: number;
  }): { priorityScore: number; priorityBucket: AdminDispatchPriorityBucket } {
    const severityScores: Record<AdminDispatchSeverity, number> = {
      high: 100,
      medium: 60,
      low: 20,
    };
    let score = severityScores[args.severity];

    if (args.scheduledStart) {
      const now = Date.now();
      const startMs = args.scheduledStart.getTime();
      const minsUntilStart = (startMs - now) / (60 * 1000);
      if (minsUntilStart < 60) {
        score += 80;
      } else if (minsUntilStart < 3 * 60) {
        score += 50;
      } else if (minsUntilStart < 12 * 60) {
        score += 25;
      }
    }

    if (args.totalDispatchPasses > 2) {
      score += Math.min((args.totalDispatchPasses - 2) * 10, 40);
    }

    if (args.hasManualIntervention) {
      score -= 20;
    }

    let bucket: AdminDispatchPriorityBucket;
    if (score >= 150) bucket = "urgent";
    else if (score >= 100) bucket = "high";
    else if (score >= 60) bucket = "normal";
    else bucket = "low";

    return { priorityScore: score, priorityBucket: bucket };
  }

  private getExceptionActionPlan(args: {
    exceptionReasons: string[];
    totalDispatchPasses: number;
    hasManualIntervention: boolean;
  }): {
    severity: AdminDispatchSeverity;
    recommendedAction: AdminDispatchRecommendedAction;
    availableActions: string[];
  } {
    const reasons = new Set(args.exceptionReasons);

    if (reasons.has("all_excluded")) {
      return {
        severity: "high",
        recommendedAction: args.hasManualIntervention
          ? "open_detail"
          : "review_exclusions",
        availableActions: [
          "review_exclusions",
          "manual_redispatch",
          "manual_assign",
          "open_detail",
        ],
      };
    }

    if (reasons.has("no_candidates")) {
      return {
        severity: "high",
        recommendedAction: args.hasManualIntervention
          ? "open_detail"
          : "manual_assign",
        availableActions: [
          "manual_assign",
          "manual_redispatch",
          "open_detail",
        ],
      };
    }

    if (reasons.has("no_selection")) {
      return {
        severity: "medium",
        recommendedAction: args.hasManualIntervention
          ? "open_detail"
          : "manual_redispatch",
        availableActions: [
          "manual_redispatch",
          "manual_assign",
          "open_detail",
        ],
      };
    }

    if (reasons.has("multi_pass")) {
      return {
        severity: args.totalDispatchPasses >= 5 ? "high" : "medium",
        recommendedAction: "open_detail",
        availableActions: [
          "open_detail",
          "manual_redispatch",
          "manual_assign",
        ],
      };
    }

    return {
      severity: "low",
      recommendedAction: "monitor",
      availableActions: ["open_detail"],
    };
  }

  private buildExceptionReasons(args: {
    latestDecisionStatus: string | null;
    totalDispatchPasses: number;
    selectedDecisionCount: number;
    minDispatchPasses: number;
  }): string[] {
    const reasons: string[] = [];

    if (args.latestDecisionStatus === "no_candidates") {
      reasons.push("no_candidates");
    }

    if (args.latestDecisionStatus === "all_excluded") {
      reasons.push("all_excluded");
    }

    if (args.totalDispatchPasses >= args.minDispatchPasses) {
      reasons.push("multi_pass");
    }

    if (args.totalDispatchPasses > 0 && args.selectedDecisionCount === 0) {
      reasons.push("no_selection");
    }

    return reasons;
  }

  async recordDecision(args: RecordDispatchDecisionInput): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.recordDecisionTx(tx, args);
    });
  }

  async recordDecisionTx(
    tx: TxClient,
    args: RecordDispatchDecisionInput,
  ): Promise<void> {
    const dispatchSequence = await this.getNextDispatchSequence(tx, args.bookingId);

    const decision = await tx.dispatchDecision.create({
      data: {
        bookingId: args.bookingId,
        bookingEventId: args.bookingEventId ?? null,
        trigger: args.trigger,
        triggerDetail: args.triggerDetail ?? null,
        dispatchSequence,
        redispatchSequence: args.redispatchSequence ?? 0,
        decisionStatus: args.decisionStatus,
        selectedFranchiseOwnerId: args.selectedFranchiseOwnerId ?? null,
        selectedRank: args.selectedRank ?? null,
        selectedScore: this.toDecimal(args.selectedScore),
        scoringVersion: args.scoringVersion,
        idempotencyKey: args.idempotencyKey ?? null,
        correlationKey: args.correlationKey ?? null,
        bookingStatusAtDecision: args.bookingStatusAtDecision ?? null,
        scheduledStart: args.scheduledStart ? new Date(args.scheduledStart) : null,
        estimatedDurationMin: args.estimatedDurationMin ?? null,
        bookingSnapshot: args.bookingSnapshot,
        decisionMeta: this.toNullableJson(args.decisionMeta),
      },
    });

    if (!args.candidates.length) {
      return;
    }

    await tx.dispatchDecisionCandidate.createMany({
      data: args.candidates.map((candidate) => ({
        dispatchDecisionId: decision.id,
        franchiseOwnerId: candidate.franchiseOwnerId,
        candidateStatus: candidate.candidateStatus,
        baseRank: candidate.baseRank ?? null,
        finalRank: candidate.finalRank ?? null,
        baseScore: this.toDecimal(candidate.baseScore),
        finalScore: this.toDecimal(candidate.finalScore),
        distanceMiles: this.toDecimal(candidate.distanceMiles),
        foLoad: candidate.foLoad ?? null,
        acceptanceRate: this.toDecimal(candidate.acceptanceRate),
        completionRate: this.toDecimal(candidate.completionRate),
        cancellationRate: this.toDecimal(candidate.cancellationRate),
        acceptancePenalty: this.toDecimal(candidate.acceptancePenalty),
        completionPenalty: this.toDecimal(candidate.completionPenalty),
        cancellationPenalty: this.toDecimal(candidate.cancellationPenalty),
        loadPenalty: this.toDecimal(candidate.loadPenalty),
        reliabilityBonus: this.toDecimal(candidate.reliabilityBonus),
        finalPenalty: this.toDecimal(candidate.finalPenalty),
        reasonCode: candidate.reasonCode ?? null,
        reasonDetail: candidate.reasonDetail ?? null,
        eligibilitySnapshot: this.toNullableJson(candidate.eligibilitySnapshot),
        scoreBreakdown: this.toNullableJson(candidate.scoreBreakdown),
      })),
    });
  }

  private async getNextDispatchSequence(
    tx: TxClient,
    bookingId: string,
  ): Promise<number> {
    const aggregate = await tx.dispatchDecision.aggregate({
      where: { bookingId },
      _max: { dispatchSequence: true },
    });

    return (aggregate._max.dispatchSequence ?? 0) + 1;
  }

  private toNullableJson(
    value: Prisma.InputJsonValue | null | undefined,
  ): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return Prisma.JsonNull;
    }

    return value;
  }

  private toDecimal(
    value?: Prisma.Decimal | string | number | null,
  ): Prisma.Decimal | null {
    if (value === undefined || value === null) {
      return null;
    }

    return new Prisma.Decimal(value);
  }

  private decimalToString(value: Prisma.Decimal | null | undefined): string | null {
    return value == null ? null : value.toString();
  }

  private candidateStatusSortValue(status: string): number {
    switch (status) {
      case "selected":
        return 0;
      case "rejected":
        return 1;
      case "ranked":
        return 2;
      case "excluded":
        return 3;
      default:
        return 4;
    }
  }

  private compareCandidates(
    a: {
      candidateStatus: string;
      finalRank: number | null;
      baseRank: number | null;
      createdAt: Date;
    },
    b: {
      candidateStatus: string;
      finalRank: number | null;
      baseRank: number | null;
      createdAt: Date;
    },
  ): number {
    const statusDelta =
      this.candidateStatusSortValue(a.candidateStatus) -
      this.candidateStatusSortValue(b.candidateStatus);

    if (statusDelta !== 0) {
      return statusDelta;
    }

    const finalRankDelta =
      (a.finalRank ?? Number.MAX_SAFE_INTEGER) - (b.finalRank ?? Number.MAX_SAFE_INTEGER);
    if (finalRankDelta !== 0) {
      return finalRankDelta;
    }

    const baseRankDelta =
      (a.baseRank ?? Number.MAX_SAFE_INTEGER) - (b.baseRank ?? Number.MAX_SAFE_INTEGER);
    if (baseRankDelta !== 0) {
      return baseRankDelta;
    }

    return a.createdAt.getTime() - b.createdAt.getTime();
  }

  private mapCandidate(candidate: {
    id: string;
    franchiseOwnerId: string;
    candidateStatus: string;
    baseRank: number | null;
    finalRank: number | null;
    baseScore: Prisma.Decimal | null;
    finalScore: Prisma.Decimal | null;
    distanceMiles: Prisma.Decimal | null;
    foLoad: number | null;
    acceptanceRate: Prisma.Decimal | null;
    completionRate: Prisma.Decimal | null;
    cancellationRate: Prisma.Decimal | null;
    acceptancePenalty: Prisma.Decimal | null;
    completionPenalty: Prisma.Decimal | null;
    cancellationPenalty: Prisma.Decimal | null;
    loadPenalty: Prisma.Decimal | null;
    reliabilityBonus: Prisma.Decimal | null;
    finalPenalty: Prisma.Decimal | null;
    reasonCode: string | null;
    reasonDetail: string | null;
    eligibilitySnapshot: unknown;
    scoreBreakdown: unknown;
    createdAt: Date;
  }): AdminDispatchTimelineCandidateDto {
    return {
      id: candidate.id,
      franchiseOwnerId: candidate.franchiseOwnerId,
      candidateStatus: candidate.candidateStatus,
      baseRank: candidate.baseRank ?? null,
      finalRank: candidate.finalRank ?? null,
      baseScore: this.decimalToString(candidate.baseScore),
      finalScore: this.decimalToString(candidate.finalScore),
      distanceMiles: this.decimalToString(candidate.distanceMiles),
      foLoad: candidate.foLoad ?? null,
      acceptanceRate: this.decimalToString(candidate.acceptanceRate),
      completionRate: this.decimalToString(candidate.completionRate),
      cancellationRate: this.decimalToString(candidate.cancellationRate),
      acceptancePenalty: this.decimalToString(candidate.acceptancePenalty),
      completionPenalty: this.decimalToString(candidate.completionPenalty),
      cancellationPenalty: this.decimalToString(candidate.cancellationPenalty),
      loadPenalty: this.decimalToString(candidate.loadPenalty),
      reliabilityBonus: this.decimalToString(candidate.reliabilityBonus),
      finalPenalty: this.decimalToString(candidate.finalPenalty),
      reasonCode: candidate.reasonCode ?? null,
      reasonDetail: candidate.reasonDetail ?? null,
      eligibilitySnapshot: candidate.eligibilitySnapshot ?? null,
      scoreBreakdown: candidate.scoreBreakdown ?? null,
      createdAt: candidate.createdAt.toISOString(),
    };
  }

  private mapDecision(decision: {
    id: string;
    dispatchSequence: number;
    redispatchSequence: number;
    trigger: string;
    triggerDetail: string | null;
    decisionStatus: string;
    selectedFranchiseOwnerId: string | null;
    selectedRank: number | null;
    selectedScore: Prisma.Decimal | null;
    scoringVersion: string;
    bookingEventId: string | null;
    idempotencyKey: string | null;
    correlationKey: string | null;
    bookingStatusAtDecision: string | null;
    scheduledStart: Date | null;
    estimatedDurationMin: number | null;
    bookingSnapshot: unknown;
    decisionMeta: unknown;
    createdAt: Date;
    candidates: Array<{
      id: string;
      franchiseOwnerId: string;
      candidateStatus: string;
      baseRank: number | null;
      finalRank: number | null;
      baseScore: Prisma.Decimal | null;
      finalScore: Prisma.Decimal | null;
      distanceMiles: Prisma.Decimal | null;
      foLoad: number | null;
      acceptanceRate: Prisma.Decimal | null;
      completionRate: Prisma.Decimal | null;
      cancellationRate: Prisma.Decimal | null;
      acceptancePenalty: Prisma.Decimal | null;
      completionPenalty: Prisma.Decimal | null;
      cancellationPenalty: Prisma.Decimal | null;
      loadPenalty: Prisma.Decimal | null;
      reliabilityBonus: Prisma.Decimal | null;
      finalPenalty: Prisma.Decimal | null;
      reasonCode: string | null;
      reasonDetail: string | null;
      eligibilitySnapshot: unknown;
      scoreBreakdown: unknown;
      createdAt: Date;
    }>;
  }): AdminDispatchTimelineDecisionDto {
    return {
      id: decision.id,
      dispatchSequence: decision.dispatchSequence,
      redispatchSequence: decision.redispatchSequence,
      trigger: decision.trigger,
      triggerDetail: decision.triggerDetail ?? null,
      decisionStatus: decision.decisionStatus,
      selectedFranchiseOwnerId: decision.selectedFranchiseOwnerId ?? null,
      selectedRank: decision.selectedRank ?? null,
      selectedScore: this.decimalToString(decision.selectedScore),
      scoringVersion: decision.scoringVersion,
      bookingEventId: decision.bookingEventId ?? null,
      idempotencyKey: decision.idempotencyKey ?? null,
      correlationKey: decision.correlationKey ?? null,
      bookingStatusAtDecision: decision.bookingStatusAtDecision ?? null,
      scheduledStart: decision.scheduledStart?.toISOString() ?? null,
      estimatedDurationMin: decision.estimatedDurationMin ?? null,
      bookingSnapshot: decision.bookingSnapshot ?? null,
      decisionMeta: decision.decisionMeta ?? null,
      createdAt: decision.createdAt.toISOString(),
      candidates: [...decision.candidates]
        .sort((a, b) => this.compareCandidates(a, b))
        .map((candidate) => this.mapCandidate(candidate)),
    };
  }
}
