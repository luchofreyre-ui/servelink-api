import { Injectable } from "@nestjs/common";
import {
  DispatchExceptionActionStatus,
  DispatchExceptionActionEventType,
  Prisma,
} from "@prisma/client";

import { PrismaService } from "../../prisma";
import { getDispatchExceptionSlaPolicyHours } from "./dispatch-exception-sla.policy";
import type { DispatchExceptionNotificationReason } from "./dispatch-exception-automation.types";

const MS_PER_HOUR = 60 * 60 * 1000;

function isResolvedLike(status: DispatchExceptionActionStatus): boolean {
  return status === "resolved" || status === "dismissed";
}

@Injectable()
export class DispatchExceptionAutomationService {
  constructor(private readonly prisma: PrismaService) {}

  private async createEvent(
    tx: Prisma.TransactionClient,
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

  async syncActionSlaState(params: {
    dispatchExceptionKey: string;
  }): Promise<void> {
    const now = new Date();
    const row = await this.prisma.dispatchExceptionAction.findUnique({
      where: { dispatchExceptionKey: params.dispatchExceptionKey },
    });
    if (!row) return;

    if (isResolvedLike(row.status)) {
      await this.prisma.dispatchExceptionAction.update({
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

    const policyHours = getDispatchExceptionSlaPolicyHours({
      priority: row.priority as "critical" | "high" | "medium" | "low",
      status: row.status as
        | "open"
        | "investigating"
        | "waiting"
        | "resolved"
        | "dismissed",
    });

    if (policyHours == null) {
      await this.prisma.dispatchExceptionAction.update({
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
      await tx.dispatchExceptionAction.update({
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
          dispatchExceptionActionId: row.id,
          dispatchExceptionKey: row.dispatchExceptionKey,
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
    const rows = await this.prisma.dispatchExceptionAction.findMany({
      where: { status: { notIn: ["resolved", "dismissed"] } },
      select: { dispatchExceptionKey: true },
    });
    for (const r of rows) {
      await this.syncActionSlaState({
        dispatchExceptionKey: r.dispatchExceptionKey,
      });
    }
  }

  private async shouldEmitCriticalUnassigned(actionId: string): Promise<boolean> {
    const events = await this.prisma.dispatchExceptionActionEvent.findMany({
      where: { dispatchExceptionActionId: actionId, type: "notification_queued" },
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

    const lastAssign = await this.prisma.dispatchExceptionActionEvent.findFirst({
      where: { dispatchExceptionActionId: actionId, type: "assigned" },
      orderBy: { createdAt: "desc" },
    });
    if (!lastAssign) return false;
    return lastAssign.createdAt > lastCritical.createdAt;
  }

  async evaluateActionAutomation(params: {
    dispatchExceptionKey: string;
  }): Promise<void> {
    const load = () =>
      this.prisma.dispatchExceptionAction.findUnique({
        where: { dispatchExceptionKey: params.dispatchExceptionKey },
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
          dispatchExceptionActionId: row!.id,
          dispatchExceptionKey: row!.dispatchExceptionKey,
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
        await tx.dispatchExceptionAction.update({
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
          dispatchExceptionActionId: row!.id,
          dispatchExceptionKey: row!.dispatchExceptionKey,
          type: "sla_due_soon",
          metadataJson: {
            slaDueAt: row!.slaDueAt!.toISOString(),
            slaPolicyHours: row!.slaPolicyHours,
          },
        });
        await this.createEvent(tx, {
          dispatchExceptionActionId: row!.id,
          dispatchExceptionKey: row!.dispatchExceptionKey,
          type: "notification_queued",
          metadataJson: {
            reason: "sla_due_soon" satisfies DispatchExceptionNotificationReason,
            priority: row!.priority,
            status: row!.status,
            ownerUserId: row!.ownerUserId,
            slaDueAt: row!.slaDueAt!.toISOString(),
            reopenCount: row!.reopenCount,
          },
        });
        await tx.dispatchExceptionAction.update({
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
          dispatchExceptionActionId: row!.id,
          dispatchExceptionKey: row!.dispatchExceptionKey,
          type: "sla_overdue",
          metadataJson: {
            slaDueAt: row!.slaDueAt!.toISOString(),
            slaPolicyHours: row!.slaPolicyHours,
          },
        });
        await this.createEvent(tx, {
          dispatchExceptionActionId: row!.id,
          dispatchExceptionKey: row!.dispatchExceptionKey,
          type: "notification_queued",
          metadataJson: {
            reason: "sla_overdue" satisfies DispatchExceptionNotificationReason,
            priority: row!.priority,
            status: row!.status,
            ownerUserId: row!.ownerUserId,
            slaDueAt: row!.slaDueAt!.toISOString(),
            reopenCount: row!.reopenCount,
          },
        });
        await tx.dispatchExceptionAction.update({
          where: { id: row!.id },
          data: {
            slaOverdueNotifiedAt: now,
            lastNotificationQueuedAt: now,
          },
        });
      });
    }

    row = await load();
    if (
      !row ||
      isResolvedLike(row.status) ||
      row.slaStatus !== "overdue" ||
      !row.slaDueAt
    ) {
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
          dispatchExceptionActionId: row!.id,
          dispatchExceptionKey: row!.dispatchExceptionKey,
          type: "escalation_ready",
          metadataJson: {
            slaDueAt: row!.slaDueAt!.toISOString(),
            priority: row!.priority,
            overdueMinutes,
          },
        });
        await tx.dispatchExceptionAction.update({
          where: { id: row!.id },
          data: { escalationReadyAt: now },
        });
      });
    }
  }

  async evaluateAllActiveActionAutomation(): Promise<void> {
    await this.syncAllActiveActionSlaStates();
    const rows = await this.prisma.dispatchExceptionAction.findMany({
      where: { status: { notIn: ["resolved", "dismissed"] } },
      select: { dispatchExceptionKey: true },
    });
    for (const r of rows) {
      await this.evaluateActionAutomation({
        dispatchExceptionKey: r.dispatchExceptionKey,
      });
    }
  }

  async handleActionChanged(params: {
    dispatchExceptionKey: string;
  }): Promise<void> {
    await this.syncActionSlaState({
      dispatchExceptionKey: params.dispatchExceptionKey,
    });
    await this.evaluateActionAutomation({
      dispatchExceptionKey: params.dispatchExceptionKey,
    });
  }

  async emitLifecycleNotificationQueued(params: {
    dispatchExceptionKey: string;
    reason: "reopened" | "validation_failed";
    reopenCount?: number;
  }): Promise<void> {
    const row = await this.prisma.dispatchExceptionAction.findUnique({
      where: { dispatchExceptionKey: params.dispatchExceptionKey },
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

    await this.prisma.$transaction(async (tx) => {
      await this.createEvent(tx, {
        dispatchExceptionActionId: row.id,
        dispatchExceptionKey: row.dispatchExceptionKey,
        type: "notification_queued",
        metadataJson: meta,
      });
      await tx.dispatchExceptionAction.update({
        where: { id: row.id },
        data: { lastNotificationQueuedAt: now },
      });
    });
  }
}
