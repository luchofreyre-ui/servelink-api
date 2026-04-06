import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma";
import type { AdminActivityItem, AdminActivityResponse } from "./admin-activity.types";

/** Raised so merged newest-first feed still includes fresh command-center rows on page 1. */
const PER_SOURCE_LIMIT = 80;
const DEFAULT_PAGE_LIMIT = 25;

/**
 * Newest-first feeds must not rank bogus far-future `createdAt` values (bad imports / seeds) above
 * real operations. Those rows sink to the end so the first page stays actionable.
 */
function activityFeedSortTime(createdAtIso: string, nowMs: number): number {
  const t = new Date(createdAtIso).getTime();
  if (!Number.isFinite(t)) {
    return 0;
  }
  const maxPlausibleFutureMs = nowMs + 24 * 60 * 60 * 1000;
  if (t > maxPlausibleFutureMs) {
    return 0;
  }
  return t;
}

@Injectable()
export class AdminActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async getActivity(args?: { limit?: number; offset?: number }): Promise<AdminActivityResponse> {
    const limit = Math.min(Math.max(args?.limit ?? DEFAULT_PAGE_LIMIT, 1), 100);
    const offset = Math.min(Math.max(args?.offset ?? 0, 0), 200);
    const windowNeed = offset + limit + 50;
    const perSourceTake = Math.min(500, Math.max(PER_SOURCE_LIMIT, windowNeed));

    const commandCenterTake = Math.min(
      500,
      Math.max(perSourceTake, offset + limit + 120),
    );

    const [
      publishAudits,
      operatorNotes,
      manualDecisions,
      adminDispatchDecisions,
      anomalyAudits,
      commandCenter,
    ] = await Promise.all([
      this.fetchPublishAuditItems(perSourceTake),
      this.fetchOperatorNoteItems(perSourceTake),
      this.fetchManualDispatchItems(perSourceTake),
      this.fetchAdminDispatchDecisionItems(perSourceTake),
      this.fetchAnomalyAuditItems(perSourceTake),
      this.fetchCommandCenterActivityItems(commandCenterTake),
    ]);

    const nowMs = Date.now();
    const merged: AdminActivityItem[] = [
      ...publishAudits,
      ...operatorNotes,
      ...manualDecisions,
      ...adminDispatchDecisions,
      ...anomalyAudits,
      ...commandCenter,
    ].sort((a, b) => {
      const tb =
        activityFeedSortTime(b.createdAt, nowMs) - activityFeedSortTime(a.createdAt, nowMs);
      if (tb !== 0) return tb;
      // Same-ms ties: prefer command-center / admin dispatch rows so fresh mutations surface on page 1.
      const pri = (t: string) =>
        t.startsWith("admin_booking_") ||
        t === "admin_operator_note_saved" ||
        t.startsWith("dispatch_admin_")
          ? 1
          : 0;
      const tie = pri(b.type) - pri(a.type);
      if (tie !== 0) return tie;
      return b.id.localeCompare(a.id);
    });

    const items = merged.slice(offset, offset + limit);
    const nextCursor =
      offset + items.length < merged.length ? String(offset + items.length) : null;

    return {
      items,
      nextCursor,
    };
  }

  private withActivityLinks(item: Omit<AdminActivityItem, "summary" | "detailPath" | "anomalyId">): AdminActivityItem {
    const description = item.description;
    return {
      ...item,
      description,
      summary: description,
      detailPath: item.bookingId ? `/admin/bookings/${item.bookingId}` : null,
      anomalyId: null,
    };
  }

  private async fetchPublishAuditItems(take: number): Promise<AdminActivityItem[]> {
    const audits = await this.prisma.dispatchConfigPublishAudit.findMany({
      orderBy: { publishedAt: "desc" },
      take,
    });

    return audits.map((a) =>
      this.withActivityLinks({
        id: a.id,
        type: "dispatch_config_published",
        actorAdminUserId: a.publishedByAdminUserId ?? null,
        createdAt: a.publishedAt.toISOString(),
        bookingId: null as string | null,
        dispatchConfigId: a.dispatchConfigId,
        title: "Dispatch config published",
        description: `Published dispatch config v${a.toVersion}${a.fromVersion != null ? ` from v${a.fromVersion}` : ""}.`,
        metadata: { fromVersion: a.fromVersion, toVersion: a.toVersion },
      }),
    );
  }

  private async fetchOperatorNoteItems(take: number): Promise<AdminActivityItem[]> {
    const notes = await this.prisma.dispatchOperatorNote.findMany({
      orderBy: { createdAt: "desc" },
      take,
    });

    return notes.map((n) =>
      this.withActivityLinks({
        id: n.id,
        type: "dispatch_operator_note_added",
        actorAdminUserId: n.adminUserId ?? null,
        createdAt: n.createdAt.toISOString(),
        bookingId: n.bookingId,
        dispatchConfigId: null as string | null,
        title: "Operator note added",
        description: `Added operator note to booking ${n.bookingId}.`,
        metadata: {},
      }),
    );
  }

  private async fetchManualDispatchItems(take: number): Promise<AdminActivityItem[]> {
    const decisions = await (this.prisma as any).dispatchDecision.findMany({
      where: {
        trigger: { in: ["manual_assign", "redispatch_manual", "manual_exclusion"] },
      },
      orderBy: { createdAt: "desc" },
      take,
    });

    return decisions.map((d: any) => {
      const type =
        d.trigger === "manual_assign"
          ? "dispatch_manual_assign"
          : d.trigger === "redispatch_manual"
            ? "dispatch_manual_redispatch"
            : "dispatch_manual_exclude_provider";
      const title =
        d.trigger === "manual_assign"
          ? "Manual dispatch assignment"
          : d.trigger === "redispatch_manual"
            ? "Manual redispatch"
            : "Manual provider exclusion";
      const description =
        d.trigger === "manual_assign"
          ? `Booking ${d.bookingId} manually assigned.`
          : d.trigger === "redispatch_manual"
            ? `Booking ${d.bookingId} manually redispatched.`
            : `Provider excluded for booking ${d.bookingId}.`;
      const meta = (d.decisionMeta as Record<string, unknown>) ?? {};
      const actorAdminUserId =
        typeof meta.adminId === "string" ? meta.adminId : null;

      return this.withActivityLinks({
        id: d.id,
        type,
        actorAdminUserId,
        createdAt: d.createdAt.toISOString(),
        bookingId: d.bookingId,
        dispatchConfigId: null as string | null,
        title,
        description,
        metadata: { trigger: d.trigger },
      });
    });
  }

  private async fetchAdminDispatchDecisionItems(take: number): Promise<AdminActivityItem[]> {
    const decisions = await this.prisma.adminDispatchDecision.findMany({
      where: {
        action: { in: ["hold", "request_review"] },
        executionStatus: "applied",
      },
      orderBy: { createdAt: "desc" },
      take,
    });

    return decisions.map((d) =>
      this.withActivityLinks({
        id: d.id,
        type:
          d.action === "hold"
            ? "dispatch_admin_hold_applied"
            : "dispatch_admin_review_requested",
        actorAdminUserId: d.submittedByUserId,
        createdAt: d.createdAt.toISOString(),
        bookingId: d.bookingId,
        dispatchConfigId: null as string | null,
        title:
          d.action === "hold"
            ? "Admin hold applied"
            : "Dispatch review requested",
        description:
          d.action === "hold"
            ? `Booking ${d.bookingId} placed on admin hold.`
            : `Booking ${d.bookingId} marked for required review.`,
        metadata: {
          action: d.action,
          source: d.source,
        },
      }),
    );
  }

  private async fetchCommandCenterActivityItems(take: number): Promise<AdminActivityItem[]> {
    const rows = await this.prisma.adminCommandCenterActivity.findMany({
      orderBy: { createdAt: "desc" },
      take,
    });

    const titleByType: Record<string, string> = {
      admin_operator_note_saved: "Command center operator note saved",
      admin_booking_held: "Command center hold",
      admin_booking_marked_in_review: "Command center review",
      admin_booking_approved: "Command center approval",
      admin_booking_reassign_requested: "Command center reassign",
      OPERATOR_RELEASE_DISPATCH_LOCK: "Operator: release dispatch lock",
      OPERATOR_CLEAR_REVIEW_REQUIRED: "Operator: clear review required",
      OPERATOR_TRIGGER_REDISPATCH: "Operator: trigger redispatch",
      OPERATOR_EXCEPTION_ASSIGN_TO_ME: "Operator: exception assign to me",
      OPERATOR_EXCEPTION_RESOLVED: "Operator: exception resolved",
    };

    return rows.map((r) =>
      this.withActivityLinks({
        id: r.id,
        type: r.type,
        actorAdminUserId: r.actorUserId,
        createdAt: r.createdAt.toISOString(),
        bookingId: r.bookingId,
        dispatchConfigId: null as string | null,
        title: titleByType[r.type] ?? "Command center activity",
        description: r.summary,
        metadata: (r.metadata as Record<string, unknown>) ?? {},
      }),
    );
  }

  private async fetchAnomalyAuditItems(take: number): Promise<AdminActivityItem[]> {
    const audits = await this.prisma.opsAlertAudit.findMany({
      where: {
        action: { in: ["ack", "resolve", "assign", "unassign"] },
      },
      orderBy: { createdAt: "desc" },
      take,
      include: { opsAlertRollup: true },
    });

    const typeMap: Record<string, string> = {
      ack: "anomaly_acknowledged",
      resolve: "anomaly_resolved",
      assign: "anomaly_assigned",
      unassign: "anomaly_unassigned",
    };
    const titleMap: Record<string, string> = {
      ack: "Anomaly acknowledged",
      resolve: "Anomaly resolved",
      assign: "Anomaly assigned",
      unassign: "Anomaly unassigned",
    };

    return audits.map((a) =>
      this.withActivityLinks({
        id: a.id,
        type: typeMap[a.action] ?? "anomaly_audit",
        actorAdminUserId: a.actorAdminId ?? null,
        createdAt: a.createdAt.toISOString(),
        bookingId: a.opsAlertRollup?.bookingId ?? null,
        dispatchConfigId: null as string | null,
        title: titleMap[a.action] ?? "Anomaly action",
        description: `Anomaly fingerprint ${a.fingerprint} - ${a.action}.`,
        metadata: {
          fingerprint: a.fingerprint,
          action: a.action,
          fromStatus: a.fromStatus,
          toStatus: a.toStatus,
        },
      }),
    );
  }
}
