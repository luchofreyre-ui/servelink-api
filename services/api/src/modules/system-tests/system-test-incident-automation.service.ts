import { Injectable } from "@nestjs/common";
import {
  Prisma,
  SystemTestIncidentActionStatus,
  SystemTestIncidentEventType,
} from "@prisma/client";

import { PrismaService } from "../../prisma";
import { getSystemTestIncidentSlaPolicyHours } from "./system-test-incident-sla.policy";
import type { SystemTestIncidentNotificationReason } from "./system-test-incident-notifications.types";

const MS_PER_HOUR = 60 * 60 * 1000;

function isResolvedLike(status: SystemTestIncidentActionStatus): boolean {
  return status === "resolved" || status === "dismissed";
}

@Injectable()
export class SystemTestIncidentAutomationService {
  constructor(private readonly prisma: PrismaService) {}

  private async createEvent(
    tx: Prisma.TransactionClient,
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

  async syncActionSlaState(params: { incidentKey: string }): Promise<void> {
    const now = new Date();
    const row = await this.prisma.systemTestIncidentAction.findUnique({
      where: { incidentKey: params.incidentKey },
    });
    if (!row) return;

    if (isResolvedLike(row.status)) {
      await this.prisma.systemTestIncidentAction.update({
        where: { id: row.id },
        data: {
          slaPolicyHours: null,
          slaStartedAt: null,
          slaDueAt: null,
          slaStatus: "completed",
          slaLastEvaluatedAt: now,
        },
      });
      return;
    }

    const policyHours = getSystemTestIncidentSlaPolicyHours({
      priority: row.priority as "critical" | "high" | "medium" | "low",
      status: row.status as
        | "open"
        | "investigating"
        | "fixing"
        | "validating"
        | "resolved"
        | "dismissed",
    });

    if (policyHours == null) {
      await this.prisma.systemTestIncidentAction.update({
        where: { id: row.id },
        data: {
          slaPolicyHours: null,
          slaStartedAt: null,
          slaDueAt: null,
          slaStatus: "paused",
          slaLastEvaluatedAt: now,
        },
      });
      return;
    }

    const startedAt = row.slaStartedAt ?? row.createdAt;
    const policyMs = policyHours * MS_PER_HOUR;
    const dueAt = new Date(startedAt.getTime() + policyMs);

    const thresholdDueSoon = Math.max(policyMs * 0.25, MS_PER_HOUR);
    const remainingMs = dueAt.getTime() - now.getTime();

    let slaStatus: string;
    if (remainingMs < 0) {
      slaStatus = "overdue";
    } else if (remainingMs <= thresholdDueSoon) {
      slaStatus = "due_soon";
    } else {
      slaStatus = "on_track";
    }

    const policyOrDueChanged =
      row.slaPolicyHours !== policyHours ||
      !row.slaDueAt ||
      row.slaDueAt.getTime() !== dueAt.getTime();

    const firstStart = row.slaStartedAt == null;

    await this.prisma.$transaction(async (tx) => {
      await tx.systemTestIncidentAction.update({
        where: { id: row.id },
        data: {
          slaPolicyHours: policyHours,
          slaStartedAt: startedAt,
          slaDueAt: dueAt,
          slaStatus,
          slaLastEvaluatedAt: now,
          ...(policyOrDueChanged ?
            {
              slaDueSoonNotifiedAt: null,
              slaOverdueNotifiedAt: null,
              escalationReadyAt: null,
            }
          : {}),
        },
      });

      if (firstStart) {
        await this.createEvent(tx, {
          incidentActionId: row.id,
          incidentKey: row.incidentKey,
          type: "sla_started",
          metadataJson: {
            slaDueAt: dueAt.toISOString(),
            slaPolicyHours: policyHours,
          },
        });
      }
    });
  }

  async syncAllActiveActionSlaStates(): Promise<void> {
    const rows = await this.prisma.systemTestIncidentAction.findMany({
      where: { status: { notIn: ["resolved", "dismissed"] } },
      select: { incidentKey: true },
    });
    for (const r of rows) {
      await this.syncActionSlaState({ incidentKey: r.incidentKey });
    }
  }

  private async shouldEmitCriticalUnassigned(actionId: string): Promise<boolean> {
    const events = await this.prisma.systemTestIncidentEvent.findMany({
      where: { incidentActionId: actionId, type: "notification_queued" },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    let lastCritical: { createdAt: Date } | null = null;
    for (const e of events) {
      const m = e.metadataJson as Record<string, unknown> | null;
      if (m?.reason === "new_unassigned_critical") {
        lastCritical = e;
        break;
      }
    }
    if (!lastCritical) return true;

    const lastAssign = await this.prisma.systemTestIncidentEvent.findFirst({
      where: { incidentActionId: actionId, type: "assigned" },
      orderBy: { createdAt: "desc" },
    });
    if (!lastAssign) return false;
    return lastAssign.createdAt > lastCritical.createdAt;
  }

  async evaluateActionAutomation(params: { incidentKey: string }): Promise<void> {
    const load = () =>
      this.prisma.systemTestIncidentAction.findUnique({
        where: { incidentKey: params.incidentKey },
      });

    let row = await load();
    if (!row || isResolvedLike(row.status)) return;

    const now = new Date();

    if (
      row.priority === "critical" &&
      !row.ownerUserId &&
      (await this.shouldEmitCriticalUnassigned(row.id))
    ) {
      await this.prisma.$transaction(async (tx) => {
        await this.createEvent(tx, {
          incidentActionId: row!.id,
          incidentKey: row!.incidentKey,
          type: "notification_queued",
          metadataJson: {
            reason: "new_unassigned_critical",
            priority: row!.priority,
            status: row!.status,
            ownerUserId: null,
            slaDueAt: row!.slaDueAt?.toISOString() ?? null,
            reopenCount: row!.reopenCount,
          },
        });
        await tx.systemTestIncidentAction.update({
          where: { id: row!.id },
          data: { lastNotificationQueuedAt: now },
        });
      });
    }

    row = await load();
    if (!row || isResolvedLike(row.status)) return;

    if (
      row.slaStatus === "due_soon" &&
      !row.slaDueSoonNotifiedAt &&
      row.slaDueAt &&
      row.slaPolicyHours != null
    ) {
      await this.prisma.$transaction(async (tx) => {
        await this.createEvent(tx, {
          incidentActionId: row!.id,
          incidentKey: row!.incidentKey,
          type: "sla_due_soon",
          metadataJson: {
            slaDueAt: row!.slaDueAt!.toISOString(),
            slaPolicyHours: row!.slaPolicyHours,
          },
        });
        await this.createEvent(tx, {
          incidentActionId: row!.id,
          incidentKey: row!.incidentKey,
          type: "notification_queued",
          metadataJson: {
            reason: "sla_due_soon" satisfies SystemTestIncidentNotificationReason,
            priority: row!.priority,
            status: row!.status,
            ownerUserId: row!.ownerUserId,
            slaDueAt: row!.slaDueAt!.toISOString(),
            reopenCount: row!.reopenCount,
          },
        });
        await tx.systemTestIncidentAction.update({
          where: { id: row!.id },
          data: {
            slaDueSoonNotifiedAt: now,
            lastNotificationQueuedAt: now,
          },
        });
      });
    }

    row = await load();
    if (!row || isResolvedLike(row.status)) return;

    if (
      row.slaStatus === "overdue" &&
      !row.slaOverdueNotifiedAt &&
      row.slaDueAt &&
      row.slaPolicyHours != null
    ) {
      await this.prisma.$transaction(async (tx) => {
        await this.createEvent(tx, {
          incidentActionId: row!.id,
          incidentKey: row!.incidentKey,
          type: "sla_overdue",
          metadataJson: {
            slaDueAt: row!.slaDueAt!.toISOString(),
            slaPolicyHours: row!.slaPolicyHours,
          },
        });
        await this.createEvent(tx, {
          incidentActionId: row!.id,
          incidentKey: row!.incidentKey,
          type: "notification_queued",
          metadataJson: {
            reason: "sla_overdue" satisfies SystemTestIncidentNotificationReason,
            priority: row!.priority,
            status: row!.status,
            ownerUserId: row!.ownerUserId,
            slaDueAt: row!.slaDueAt!.toISOString(),
            reopenCount: row!.reopenCount,
          },
        });
        await tx.systemTestIncidentAction.update({
          where: { id: row!.id },
          data: {
            slaOverdueNotifiedAt: now,
            lastNotificationQueuedAt: now,
          },
        });
      });
    }

    row = await load();
    if (!row || isResolvedLike(row.status) || row.slaStatus !== "overdue" || !row.slaDueAt) {
      return;
    }

    const overdueMs = now.getTime() - row.slaDueAt.getTime();
    const overdueMinutes = Math.floor(overdueMs / 60_000);
    const windowMs = (row.slaPolicyHours ?? 0) * MS_PER_HOUR;
    const halfWindowBreached = windowMs > 0 && overdueMs >= windowMs * 0.5;
    const escalationWorthy = row.priority === "critical" || halfWindowBreached;

    if (escalationWorthy && !row.escalationReadyAt) {
      await this.prisma.$transaction(async (tx) => {
        await this.createEvent(tx, {
          incidentActionId: row!.id,
          incidentKey: row!.incidentKey,
          type: "escalation_ready",
          metadataJson: {
            slaDueAt: row!.slaDueAt!.toISOString(),
            priority: row!.priority,
            overdueMinutes,
          },
        });
        await tx.systemTestIncidentAction.update({
          where: { id: row!.id },
          data: { escalationReadyAt: now },
        });
      });
    }
  }

  async evaluateAllActiveActionAutomation(): Promise<void> {
    await this.syncAllActiveActionSlaStates();
    const rows = await this.prisma.systemTestIncidentAction.findMany({
      where: { status: { notIn: ["resolved", "dismissed"] } },
      select: { incidentKey: true },
    });
    for (const r of rows) {
      await this.evaluateActionAutomation({ incidentKey: r.incidentKey });
    }
  }

  async handleActionChanged(params: { incidentKey: string }): Promise<void> {
    await this.syncActionSlaState({ incidentKey: params.incidentKey });
    await this.evaluateActionAutomation({ incidentKey: params.incidentKey });
  }

  async emitLifecycleNotificationQueued(params: {
    incidentKey: string;
    reason: "reopened" | "validation_failed";
    reopenCount?: number;
    runId?: string;
  }): Promise<void> {
    const row = await this.prisma.systemTestIncidentAction.findUnique({
      where: { incidentKey: params.incidentKey },
    });
    if (!row) return;

    const now = new Date();
    const meta: Record<string, unknown> = {
      reason: params.reason,
      priority: row.priority,
      status: row.status,
      ownerUserId: row.ownerUserId,
      slaDueAt: row.slaDueAt?.toISOString() ?? null,
      reopenCount: params.reopenCount ?? row.reopenCount,
    };
    if (params.runId) meta.runId = params.runId;

    await this.prisma.$transaction(async (tx) => {
      await this.createEvent(tx, {
        incidentActionId: row.id,
        incidentKey: row.incidentKey,
        type: "notification_queued",
        metadataJson: meta,
      });
      await tx.systemTestIncidentAction.update({
        where: { id: row.id },
        data: { lastNotificationQueuedAt: now },
      });
    });
  }
}
