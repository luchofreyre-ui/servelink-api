import { Injectable } from "@nestjs/common";
import type { BookingStatus } from "@prisma/client";
import { PaymentLifecycleReconciliationCronService } from "../../modules/billing/payment-lifecycle-reconciliation.cron.service";
import { RemainingBalanceAuthorizationCronService } from "../../modules/billing/remaining-balance-authorization.cron.service";
import { buildSystemOpsDrilldownEligibility } from "../../modules/dispatch/dispatch-ops-eligibility";
import { SlotHoldsService } from "../../modules/slot-holds/slot-holds.service";
import { PrismaService } from "../../prisma";
import { CronRunLedgerService } from "./cron-run-ledger.service";
import { HealthService } from "./health.service";
import { ReliabilityMetricsService } from "./reliability-metrics.service";

type DrilldownLimit = number | undefined;

const PAYMENT_OPS_ANOMALY_TYPES = ["payment_missing", "payment_mismatch"] as const;
const PAYMENT_ANOMALY_RESOLVED_STATUSES = ["resolved", "closed"] as const;
const OPS_ANOMALY_RESOLVED_STATUSES = ["resolved"] as const;

@Injectable()
export class OpsVisibilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly health: HealthService,
    private readonly reliabilityMetrics: ReliabilityMetricsService,
    private readonly cronRunLedger: CronRunLedgerService,
    private readonly paymentLifecycleReconciliationCron: PaymentLifecycleReconciliationCronService,
    private readonly remainingBalanceAuthorizationCron: RemainingBalanceAuthorizationCronService,
    private readonly slotHolds: SlotHoldsService,
  ) {}

  async getSummary() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalBookings,
      assignedBookings,
      unassignedBookings,
      invalidAssignmentStateBookings,
      dispatchLockedBookings,
      reviewRequiredBookings,
      deferredDispatchDecisions,
      manualDispatchActionsLast24h,
      openOpsAnomalies,
      openSystemTestIncidents,
      activeSystemTestAutomationJobs,
      slotHoldIntegrity,
      paymentSummary,
      cronLedger,
    ] = await Promise.all([
      this.safeCount("booking"),
      this.safeCount("booking", {
        where: {
          foId: { not: null },
          status: "assigned",
        },
      }),
      this.safeCount("booking", {
        where: {
          foId: null,
          NOT: {
            status: "assigned",
          },
        },
      }),
      this.safeCount("booking", {
        where: {
          foId: { not: null },
          NOT: {
            status: "assigned",
          },
        },
      }),
      this.safeCount("booking", {
        where: {
          dispatchLockedAt: { not: null },
        },
      }),
      this.safeCount("bookingDispatchControl", {
        where: {
          reviewRequired: true,
        },
      }),
      this.safeCount("dispatchDecision", {
        where: {
          decisionStatus: "deferred",
        },
      }),
      this.safeCount("dispatchDecision", {
        where: {
          createdAt: { gte: last24h },
          trigger: {
            in: ["manual_assign", "manual_exclusion", "redispatch_manual"],
          },
        },
      }),
      this.safeCount("opsAnomaly", {
        where: {
          status: { not: "resolved" },
        },
      }),
      this.safeCount("systemTestIncident", {
        where: {
          status: { notIn: ["resolved", "closed"] },
        },
      }),
      this.safeCount("systemTestAutomationJob", {
        where: {
          status: {
            in: ["pending", "generated"],
          },
        },
      }),
      this.slotHolds.getSlotHoldIntegritySummary(),
      this.buildPaymentSummary(now),
      this.cronRunLedger.getSummary(now),
    ]);

    const hotspots: string[] = [];

    if (invalidAssignmentStateBookings > 0) {
      hotspots.push("invalid_assignment_state");
    }
    if (dispatchLockedBookings > 0) {
      hotspots.push("dispatch_lock_pressure");
    }
    if (reviewRequiredBookings > 0) {
      hotspots.push("review_queue_backlog");
    }
    if (deferredDispatchDecisions > 0) {
      hotspots.push("deferred_dispatch_backlog");
    }
    if (manualDispatchActionsLast24h > 0) {
      hotspots.push("manual_dispatch_intervention");
    }
    if (openOpsAnomalies > 0) {
      hotspots.push("ops_anomaly_backlog");
    }
    if (openSystemTestIncidents > 0) {
      hotspots.push("system_test_incident_backlog");
    }

    return {
      generatedAt: now.toISOString(),
      health: this.health.getHealth(),
      reliability: this.reliabilityMetrics.snapshot(),
      bookings: {
        total: totalBookings,
        assigned: assignedBookings,
        unassigned: unassignedBookings,
        invalidAssignmentState: invalidAssignmentStateBookings,
        dispatchLocked: dispatchLockedBookings,
        reviewRequired: reviewRequiredBookings,
      },
      dispatch: {
        deferredDecisions: deferredDispatchDecisions,
        manualActionsLast24h: manualDispatchActionsLast24h,
      },
      anomalies: {
        openOpsAnomalies,
      },
      systemTests: {
        openIncidents: openSystemTestIncidents,
        activeAutomationJobs: activeSystemTestAutomationJobs,
      },
      payment: paymentSummary,
      cron: {
        reconciliation:
          this.paymentLifecycleReconciliationCron.getHealthSnapshot(now),
        remainingBalanceAuth:
          this.remainingBalanceAuthorizationCron.getHealthSnapshot(now),
      },
      cronLedger,
      slotHolds: slotHoldIntegrity,
      hotspots,
    };
  }

  private async buildPaymentSummary(now = new Date()) {
    const [bookingStates, anomalies, staleBuckets] = await Promise.all([
      this.buildPaymentBookingStates(),
      this.buildPaymentAnomalySummary(now),
      this.buildStalePendingPaymentBuckets(now),
    ]);

    const flags = {
      hasRecentPaymentFailures:
        anomalies.available === true
          ? anomalies.recentPaymentAnomaliesLast24h > 0
          : false,
      hasStalePendingPayments:
        staleBuckets.available === true ? staleBuckets[">30d"] > 0 : false,
      hasDepositStateMismatch:
        bookingStates.available === true
          ? bookingStates.depositStateMismatch > 0
          : false,
    };

    return {
      bookingStates,
      anomalies,
      staleBuckets,
      flags,
    };
  }

  private async buildPaymentBookingStates() {
    const delegate = this.getDelegate("booking");
    if (!delegate || typeof delegate.count !== "function") {
      return { available: false as const };
    }

    try {
      const [
        pendingPayment,
        authorized,
        depositSucceeded,
        completedMissingPaymentAlignment,
        depositStateMismatch,
      ] = await Promise.all([
        delegate.count({ where: { status: "pending_payment" } }),
        delegate.count({ where: { paymentStatus: "authorized" } }),
        delegate.count({
          where: { publicDepositStatus: "deposit_succeeded" },
        }),
        delegate.count({
          where: {
            status: "completed",
            paymentStatus: { notIn: ["paid", "authorized", "waived"] },
          },
        }),
        delegate.count({
          where: {
            publicDepositStatus: "deposit_succeeded",
            publicDepositPaymentIntentId: null,
          },
        }),
      ]);

      return {
        available: true as const,
        pendingPayment,
        authorized,
        depositSucceeded,
        completedMissingPaymentAlignment,
        depositStateMismatch,
      };
    } catch {
      return { available: false as const };
    }
  }

  private async buildPaymentAnomalySummary(now: Date) {
    const paymentAnomaly = this.getDelegate("paymentAnomaly");
    const opsAnomaly = this.getDelegate("opsAnomaly");
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [payment, ops] = await Promise.all([
      this.countGroupedAnomalies(paymentAnomaly, "kind", {
        status: { notIn: [...PAYMENT_ANOMALY_RESOLVED_STATUSES] },
      }),
      this.countGroupedAnomalies(opsAnomaly, "type", {
        type: { in: [...PAYMENT_OPS_ANOMALY_TYPES] },
        status: { notIn: [...OPS_ANOMALY_RESOLVED_STATUSES] },
      }),
    ]);

    if (!payment.available && !ops.available) {
      return { available: false as const };
    }

    const recentPaymentAnomaliesLast24h =
      (await this.safeDelegateCount(paymentAnomaly, {
        where: {
          status: { notIn: [...PAYMENT_ANOMALY_RESOLVED_STATUSES] },
          detectedAt: { gte: since },
        },
      })) +
      (await this.safeDelegateCount(opsAnomaly, {
        where: {
          type: { in: [...PAYMENT_OPS_ANOMALY_TYPES] },
          status: { notIn: [...OPS_ANOMALY_RESOLVED_STATUSES] },
          createdAt: { gte: since },
        },
      }));

    return {
      available: true as const,
      total:
        (payment.available ? payment.total : 0) +
        (ops.available ? ops.total : 0),
      paymentAnomaly: payment,
      opsAnomaly: ops,
      recentPaymentAnomaliesLast24h,
    };
  }

  private async buildStalePendingPaymentBuckets(now: Date) {
    const delegate = this.getDelegate("booking");
    if (!delegate || typeof delegate.count !== "function") {
      return { available: false as const };
    }

    const m30 = new Date(now.getTime() - 30 * 60 * 1000);
    const h2 = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    try {
      const [
        zeroToThirtyMinutes,
        thirtyMinutesToTwoHours,
        twoToTwentyFourHours,
        oneToSevenDays,
        sevenToThirtyDays,
        overThirtyDays,
      ] = await Promise.all([
        delegate.count({
          where: { status: "pending_payment", createdAt: { gte: m30 } },
        }),
        delegate.count({
          where: {
            status: "pending_payment",
            createdAt: { gte: h2, lt: m30 },
          },
        }),
        delegate.count({
          where: {
            status: "pending_payment",
            createdAt: { gte: h24, lt: h2 },
          },
        }),
        delegate.count({
          where: {
            status: "pending_payment",
            createdAt: { gte: d7, lt: h24 },
          },
        }),
        delegate.count({
          where: {
            status: "pending_payment",
            createdAt: { gte: d30, lt: d7 },
          },
        }),
        delegate.count({
          where: { status: "pending_payment", createdAt: { lt: d30 } },
        }),
      ]);

      return {
        available: true as const,
        "0-30m": zeroToThirtyMinutes,
        "30m-2h": thirtyMinutesToTwoHours,
        "2h-24h": twoToTwentyFourHours,
        "1-7d": oneToSevenDays,
        "7-30d": sevenToThirtyDays,
        ">30d": overThirtyDays,
      };
    } catch {
      return { available: false as const };
    }
  }

  private async countGroupedAnomalies(
    delegate: unknown,
    field: "kind" | "type",
    where: Record<string, unknown>,
  ) {
    if (
      !delegate ||
      typeof (delegate as { count?: unknown }).count !== "function" ||
      typeof (delegate as { groupBy?: unknown }).groupBy !== "function"
    ) {
      return { available: false as const };
    }

    try {
      const [total, grouped] = await Promise.all([
        (delegate as { count: (args: unknown) => Promise<number> }).count({
          where,
        }),
        (
          delegate as {
            groupBy: (args: unknown) => Promise<
              Array<Record<string, unknown> & { _count?: { _all?: number } }>
            >;
          }
        ).groupBy({
          by: [field],
          where,
          _count: { _all: true },
        }),
      ]);

      return {
        available: true as const,
        total,
        byType: Object.fromEntries(
          grouped.map((row) => [
            String(row[field] ?? "unknown"),
            Number(row._count?._all ?? 0),
          ]),
        ),
      };
    } catch {
      return { available: false as const };
    }
  }

  async getInvalidAssignmentStateBookings(limit?: DrilldownLimit) {
    const rows = await this.prisma.booking.findMany({
      where: {
        foId: { not: null },
        NOT: {
          status: "assigned",
        },
      },
      select: {
        id: true,
        status: true,
        foId: true,
        scheduledStart: true,
        dispatchLockedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ updatedAt: "desc" }],
      take: this.normalizeLimit(limit),
    });
    return this.attachBookingRowEligibility(rows);
  }

  async getDispatchLockedBookings(limit?: DrilldownLimit) {
    const rows = await this.prisma.booking.findMany({
      where: {
        dispatchLockedAt: { not: null },
      },
      select: {
        id: true,
        status: true,
        foId: true,
        scheduledStart: true,
        dispatchLockedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ dispatchLockedAt: "desc" }],
      take: this.normalizeLimit(limit),
    });
    return this.attachBookingRowEligibility(rows);
  }

  async getReviewRequiredBookings(limit?: DrilldownLimit) {
    const rows = await this.prisma.bookingDispatchControl.findMany({
      where: {
        reviewRequired: true,
      },
      select: {
        bookingId: true,
        reviewRequired: true,
        reviewReason: true,
        reviewSource: true,
        updatedAt: true,
        booking: {
          select: {
            id: true,
            status: true,
            foId: true,
            scheduledStart: true,
            dispatchLockedAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
      take: this.normalizeLimit(limit),
    });
    if (rows.length === 0) {
      return rows;
    }
    const ids = rows.map((r) => r.bookingId);
    const actions = await this.prisma.dispatchExceptionAction.findMany({
      where: {
        dispatchExceptionKey: { in: ids.map((id) => `dex_v1_${id}`) },
      },
      select: { dispatchExceptionKey: true, status: true },
    });
    const actionByKey = new Map(actions.map((a) => [a.dispatchExceptionKey, a]));
    return rows.map((row) => {
      const b = row.booking;
      const dexKey = `dex_v1_${row.bookingId}`;
      const action = actionByKey.get(dexKey) ?? null;
      if (!b) {
        const merged = buildSystemOpsDrilldownEligibility(
          {
            foId: null,
            status: "canceled",
            dispatchLockedAt: null,
          },
          { reviewRequired: row.reviewRequired },
          action,
        );
        return { ...row, ...merged };
      }
      const merged = buildSystemOpsDrilldownEligibility(
        b,
        { reviewRequired: row.reviewRequired },
        action,
      );
      return { ...row, ...merged };
    });
  }

  async getDeferredDispatchDecisions(limit?: DrilldownLimit) {
    try {
      const rows = await this.prisma.dispatchDecision.findMany({
        where: {
          decisionStatus: "deferred",
        },
        select: {
          id: true,
          bookingId: true,
          trigger: true,
          dispatchSequence: true,
          redispatchSequence: true,
          decisionStatus: true,
          scoringVersion: true,
          selectedFranchiseOwnerId: true,
          createdAt: true,
        },
        orderBy: [{ createdAt: "desc" }],
        take: this.normalizeLimit(limit),
      });
      return await this.attachDecisionRowEligibility(rows);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Deferred dispatch drilldown failed: ${message}`);
    }
  }

  async getManualDispatchActionsLast24h(limit?: DrilldownLimit) {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const rows = await (this.prisma as any).dispatchDecision.findMany({
      where: {
        createdAt: { gte: last24h },
        trigger: {
          in: ["manual_assign", "manual_exclusion", "redispatch_manual"],
        },
      },
      select: {
        id: true,
        bookingId: true,
        trigger: true,
        dispatchSequence: true,
        redispatchSequence: true,
        decisionStatus: true,
        selectedFranchiseOwnerId: true,
        decisionMeta: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: "desc" }],
      take: this.normalizeLimit(limit),
    });
    return this.attachDecisionRowEligibility(rows);
  }

  private async attachBookingRowEligibility<
    T extends {
      id: string;
      status: BookingStatus;
      foId: string | null;
      dispatchLockedAt: Date | null;
    },
  >(rows: T[]) {
    if (rows.length === 0) {
      return rows as Array<T & Record<string, unknown>>;
    }
    const ids = rows.map((r) => r.id);
    const [controls, actions] = await Promise.all([
      this.prisma.bookingDispatchControl.findMany({
        where: { bookingId: { in: ids } },
        select: { bookingId: true, reviewRequired: true },
      }),
      this.prisma.dispatchExceptionAction.findMany({
        where: {
          dispatchExceptionKey: { in: ids.map((id) => `dex_v1_${id}`) },
        },
        select: { dispatchExceptionKey: true, status: true },
      }),
    ]);
    const controlByBooking = new Map(controls.map((c) => [c.bookingId, c]));
    const actionByKey = new Map(actions.map((a) => [a.dispatchExceptionKey, a]));
    return rows.map((row) => {
      const control = controlByBooking.get(row.id) ?? null;
      const dexKey = `dex_v1_${row.id}`;
      const action = actionByKey.get(dexKey) ?? null;
      const merged = buildSystemOpsDrilldownEligibility(row, control, action);
      return { ...row, ...merged };
    });
  }

  private async attachDecisionRowEligibility<
    T extends { bookingId: string },
  >(rows: T[]) {
    if (rows.length === 0) {
      return rows as Array<T & Record<string, unknown>>;
    }
    const bookingIds = [...new Set(rows.map((r) => r.bookingId))];
    const [bookings, controls, actions] = await Promise.all([
      this.prisma.booking.findMany({
        where: { id: { in: bookingIds } },
        select: {
          id: true,
          status: true,
          foId: true,
          dispatchLockedAt: true,
        },
      }),
      this.prisma.bookingDispatchControl.findMany({
        where: { bookingId: { in: bookingIds } },
        select: { bookingId: true, reviewRequired: true },
      }),
      this.prisma.dispatchExceptionAction.findMany({
        where: {
          dispatchExceptionKey: {
            in: bookingIds.map((id) => `dex_v1_${id}`),
          },
        },
        select: { dispatchExceptionKey: true, status: true },
      }),
    ]);
    const bookingById = new Map(bookings.map((b) => [b.id, b]));
    const controlByBooking = new Map(controls.map((c) => [c.bookingId, c]));
    const actionByKey = new Map(actions.map((a) => [a.dispatchExceptionKey, a]));

    return rows.map((row) => {
      const b = bookingById.get(row.bookingId);
      if (!b) {
        const action =
          actionByKey.get(`dex_v1_${row.bookingId}`) ?? null;
        const merged = buildSystemOpsDrilldownEligibility(
          {
            foId: null,
            status: "canceled" as BookingStatus,
            dispatchLockedAt: null,
          },
          null,
          action,
        );
        return { ...row, ...merged };
      }
      const control = controlByBooking.get(row.bookingId) ?? null;
      const action =
        actionByKey.get(`dex_v1_${row.bookingId}`) ?? null;
      const merged = buildSystemOpsDrilldownEligibility(b, control, action);
      return { ...row, ...merged };
    });
  }

  private normalizeLimit(limit?: number): number {
    if (typeof limit !== "number" || !Number.isFinite(limit)) {
      return 50;
    }
    return Math.max(1, Math.min(200, Math.floor(limit)));
  }

  private async safeCount(modelName: string, args?: Record<string, unknown>) {
    const delegate = this.getDelegate(modelName);
    if (!delegate || typeof delegate.count !== "function") {
      return 0;
    }

    try {
      return await delegate.count(args ?? {});
    } catch {
      return 0;
    }
  }

  private getDelegate(modelName: string) {
    return (this.prisma as unknown as Record<string, unknown>)[modelName] as
      | { count?: (args?: unknown) => Promise<number>; groupBy?: unknown }
      | undefined;
  }

  private async safeDelegateCount(delegate: unknown, args: unknown) {
    if (!delegate || typeof (delegate as { count?: unknown }).count !== "function") {
      return 0;
    }

    try {
      return await (delegate as { count: (args: unknown) => Promise<number> }).count(
        args,
      );
    } catch {
      return 0;
    }
  }
}
