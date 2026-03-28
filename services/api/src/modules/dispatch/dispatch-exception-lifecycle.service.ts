import { Injectable } from "@nestjs/common";
import { DispatchExceptionActionStatus, Prisma } from "@prisma/client";

import { PrismaService } from "../../prisma";
import type { AdminDispatchExceptionItemDto } from "./dto/admin-dispatch-exceptions.dto";
import { DispatchExceptionActionsService } from "./dispatch-exception-actions.service";
import { DispatchExceptionAutomationService } from "./dispatch-exception-automation.service";
import { buildDispatchExceptionKeyFromBookingId } from "./dispatch-exception-key";

function readMeta(json: unknown): Record<string, unknown> {
  if (json && typeof json === "object" && !Array.isArray(json)) {
    return json as Record<string, unknown>;
  }
  return {};
}

@Injectable()
export class DispatchExceptionLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly actions: DispatchExceptionActionsService,
    private readonly automation: DispatchExceptionAutomationService,
  ) {}

  /**
   * After dispatch exceptions are computed for the admin surface, sync the action layer.
   * Order: sync presence → evaluate resolved → automation runs inside actions/bootstrap.
   */
  async syncAfterExceptionsRefreshed(
    activeItems: AdminDispatchExceptionItemDto[],
    actorUserId?: string | null,
  ): Promise<void> {
    const activeKeys = new Set(
      activeItems.map((i) => buildDispatchExceptionKeyFromBookingId(i.bookingId)),
    );

    for (const item of activeItems) {
      await this.actions.bootstrapOrRefreshFromExceptionItem(item, actorUserId);
    }

    await this.evaluateResolvedAndDismissedAgainstActiveSet(activeKeys, actorUserId);

    await this.automation.syncAllActiveActionSlaStates();
    const activeRows = await this.prisma.dispatchExceptionAction.findMany({
      where: { status: { notIn: ["resolved", "dismissed"] } },
      select: { dispatchExceptionKey: true },
    });
    for (const r of activeRows) {
      await this.automation.evaluateActionAutomation({
        dispatchExceptionKey: r.dispatchExceptionKey,
      });
    }
  }

  private async evaluateResolvedAndDismissedAgainstActiveSet(
    activeKeys: Set<string>,
    actorUserId?: string | null,
  ): Promise<void> {
    const candidates = await this.prisma.dispatchExceptionAction.findMany({
      where: {
        status: { in: ["resolved", "dismissed"] },
      },
    });

    const now = new Date();

    for (const row of candidates) {
      const key = row.dispatchExceptionKey;
      const inActive = activeKeys.has(key);

      if (row.status === "dismissed") {
        continue;
      }

      if (row.status === "resolved" && inActive) {
        await this.reopenResolvedToInvestigating(key, actorUserId);
        continue;
      }

      if (row.status === "resolved" && !inActive) {
        const meta = readMeta(row.metadataJson);
        const streak = typeof meta.absentStreak === "number" ? meta.absentStreak : 0;
        const nextStreak = streak + 1;
        const nextMeta = {
          ...meta,
          absentStreak: nextStreak,
        } as Prisma.InputJsonValue;

        await this.prisma.dispatchExceptionAction.update({
          where: { id: row.id },
          data: {
            metadataJson: nextMeta,
            validationLastCheckedAt: now,
          },
        });

        if (nextStreak >= 2) {
          await this.prisma.$transaction(async (tx) => {
            await tx.dispatchExceptionAction.update({
              where: { id: row.id },
              data: {
                validationState: "passed",
                validationLastPassedAt: now,
                validationLastFailedAt: null,
              },
            });
            await this.actions.createEvent(tx, {
              dispatchExceptionActionId: row.id,
              dispatchExceptionKey: key,
              type: "validation_passed",
              actorUserId: actorUserId ?? null,
              metadataJson: {
                absentStreak: nextStreak,
              },
            });
          });
          await this.automation.handleActionChanged({ dispatchExceptionKey: key });
        }
      }
    }
  }

  private async reopenResolvedToInvestigating(
    dispatchExceptionKey: string,
    actorUserId?: string | null,
  ): Promise<void> {
    const row = await this.prisma.dispatchExceptionAction.findUnique({
      where: { dispatchExceptionKey },
    });
    if (!row || row.status !== "resolved") return;

    const meta = readMeta(row.metadataJson);
    const nextMeta = { ...meta, absentStreak: 0 } as Prisma.InputJsonValue;
    const nextReopen = row.reopenCount + 1;

    await this.prisma.$transaction(async (tx) => {
      await this.actions.setValidationState({
        dispatchExceptionKey,
        validationState: "failed",
        checkedAt: new Date(),
        failedAt: new Date(),
        incrementReopenCount: true,
        reopenedAt: new Date(),
        tx,
      });

      await tx.dispatchExceptionAction.update({
        where: { id: row.id },
        data: {
          metadataJson: nextMeta,
          resolvedAt: null,
          status: "investigating" satisfies DispatchExceptionActionStatus,
        },
      });

      await this.actions.createEvent(tx, {
        dispatchExceptionActionId: row.id,
        dispatchExceptionKey,
        type: "reopened",
        actorUserId: actorUserId ?? null,
        metadataJson: {
          reason: "exception_reappeared",
          reopenCount: nextReopen,
        },
      });
    });

    await this.automation.emitLifecycleNotificationQueued({
      dispatchExceptionKey,
      reason: "reopened",
      reopenCount: nextReopen,
    });
    await this.automation.handleActionChanged({ dispatchExceptionKey });
  }
}
