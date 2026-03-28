import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../prisma";
import { SystemTestIncidentActionsService } from "./system-test-incident-actions.service";
import { SystemTestIncidentAutomationService } from "./system-test-incident-automation.service";
import type {
  SyncIncidentActionFromRunInput,
  SyncResolvedActionsForRunInput,
  SystemTestIncidentValidationResult,
} from "./system-test-incident-lifecycle.types";

function parseFamilyIdsJson(json: unknown): string[] {
  if (!Array.isArray(json)) return [];
  return json.filter((x): x is string => typeof x === "string");
}

@Injectable()
export class SystemTestIncidentLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly actions: SystemTestIncidentActionsService,
    private readonly automation: SystemTestIncidentAutomationService,
  ) {}

  async syncIncidentActionFromRun(input: SyncIncidentActionFromRunInput): Promise<void> {
    const touch = await this.actions.touchLastSeenRun({
      incidentKey: input.incidentKey,
      runId: input.runId,
      actorUserId: input.actorUserId,
    });

    if (touch.currentStatus === "dismissed") {
      return;
    }

    if (touch.currentStatus === "resolved") {
      await this.markResolvedReappearedInRun(input);
      const reopened = await this.prisma.systemTestIncidentAction.findUnique({
        where: { incidentKey: input.incidentKey },
        select: { reopenCount: true },
      });
      await this.automation.emitLifecycleNotificationQueued({
        incidentKey: input.incidentKey,
        reason: "reopened",
        reopenCount: reopened?.reopenCount,
        runId: input.runId,
      });
      await this.automation.handleActionChanged({
        incidentKey: input.incidentKey,
      });
      return;
    }

    if (touch.previousLastSeenRunId !== input.runId) {
      await this.emitIncidentSeenEvent({
        incidentKey: input.incidentKey,
        runId: input.runId,
        previousLastSeenRunId: touch.previousLastSeenRunId,
        currentStatus: touch.currentStatus,
        actorUserId: input.actorUserId,
      });
    }

    await this.automation.handleActionChanged({
      incidentKey: input.incidentKey,
    });
  }

  async evaluateResolvedActionsAfterRun(
    input: SyncResolvedActionsForRunInput,
  ): Promise<void> {
    const resolvedRows = await this.prisma.systemTestIncidentAction.findMany({
      where: { status: "resolved" },
      select: { incidentKey: true },
    });

    for (const row of resolvedRows) {
      const result = await this.evaluateResolvedAction(row.incidentKey, input.runId);
      if (result.passed) {
        await this.markValidationPassed(result, input.actorUserId);
      } else {
        await this.markValidationFailedAndReopen(result, input.actorUserId);
      }
    }
  }

  async evaluateResolvedAction(
    incidentKey: string,
    runId: string,
  ): Promise<SystemTestIncidentValidationResult> {
    const base = (
      partial: Partial<SystemTestIncidentValidationResult>,
    ): SystemTestIncidentValidationResult => ({
      incidentKey,
      passed: partial.passed ?? false,
      reason: partial.reason ?? "insufficient_history",
      latestRunId: runId,
      currentGapRuns: partial.currentGapRuns ?? 0,
      reappearedAfterGap: partial.reappearedAfterGap ?? false,
      activeFamilyKeys: partial.activeFamilyKeys ?? [],
      latestSeverity: partial.latestSeverity ?? null,
      trendDelta: partial.trendDelta ?? null,
    });

    const incidentInRun = await this.prisma.systemTestIncident.findFirst({
      where: { runId, incidentKey },
    });
    if (incidentInRun) {
      return base({
        passed: false,
        reason: "reappeared_in_latest_run",
        currentGapRuns: 0,
        reappearedAfterGap: false,
        trendDelta: 0,
        latestSeverity: incidentInRun.severity,
        activeFamilyKeys: [],
      });
    }

    const latestSnap = await this.prisma.systemTestIncidentSnapshot.findFirst({
      where: { incidentKey },
      orderBy: { createdAt: "desc" },
    });
    if (latestSnap && latestSnap.runId === runId && latestSnap.reappearedAfterGap) {
      return base({
        passed: false,
        reason: "families_reappeared",
        currentGapRuns: latestSnap.gapRunsBefore,
        reappearedAfterGap: true,
        trendDelta: latestSnap.gapRunsBefore,
        latestSeverity: latestSnap.severity,
        activeFamilyKeys: parseFamilyIdsJson(latestSnap.familyIdsJson),
      });
    }

    const index = await this.prisma.systemTestIncidentIndex.findUnique({
      where: { incidentKey },
    });
    if (!index) {
      return base({
        passed: false,
        reason: "insufficient_history",
        currentGapRuns: 0,
        trendDelta: 0,
        latestSeverity: latestSnap?.severity ?? null,
        activeFamilyKeys: parseFamilyIdsJson(latestSnap?.familyIdsJson),
      });
    }

    if (!(index.lastSeenRunId !== runId && index.lastSeenGapRuns >= 1)) {
      return base({
        passed: false,
        reason: "insufficient_history",
        currentGapRuns: index.lastSeenGapRuns,
        trendDelta: index.lastSeenGapRuns,
        latestSeverity: latestSnap?.severity ?? null,
        activeFamilyKeys: parseFamilyIdsJson(latestSnap?.familyIdsJson),
      });
    }

    const latestInc = await this.prisma.systemTestIncident.findFirst({
      where: { incidentKey },
      orderBy: { createdAt: "desc" },
    });

    return {
      incidentKey,
      passed: true,
      reason: "still_absent",
      latestRunId: runId,
      currentGapRuns: index.lastSeenGapRuns,
      reappearedAfterGap: false,
      trendDelta: index.lastSeenGapRuns,
      activeFamilyKeys: parseFamilyIdsJson(latestSnap?.familyIdsJson),
      latestSeverity: latestInc?.severity ?? latestSnap?.severity ?? null,
    };
  }

  private async markResolvedReappearedInRun(
    input: SyncIncidentActionFromRunInput,
  ): Promise<void> {
    const now = new Date();
    const row = await this.prisma.systemTestIncidentAction.findUnique({
      where: { incidentKey: input.incidentKey },
    });
    const nextReopen = (row?.reopenCount ?? 0) + 1;

    await this.prisma.$transaction(async (tx) => {
      await this.actions.setValidationState({
        incidentKey: input.incidentKey,
        validationState: "failed",
        checkedAt: now,
        failedAt: now,
        incrementReopenCount: true,
        reopenedAt: now,
        tx,
      });

      await this.actions.recordLifecycleEvent({
        incidentKey: input.incidentKey,
        type: "reopened",
        actorUserId: input.actorUserId,
        metadataJson: {
          reason: "auto_reopened_on_reappearance",
          runId: input.runId,
          reopenCount: nextReopen,
        },
        tx,
      });

      await this.actions.transitionStatusInternal({
        incidentKey: input.incidentKey,
        nextStatus: "fixing",
        actorUserId: input.actorUserId,
        reason: "auto_reopened_on_reappearance",
        skipTransitionValidation: true,
        clearResolvedAt: true,
        tx,
      });
    });
  }

  private async markValidationPassed(
    result: SystemTestIncidentValidationResult,
    actorUserId?: string | null,
  ): Promise<void> {
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await this.actions.setValidationState({
        incidentKey: result.incidentKey,
        validationState: "passed",
        checkedAt: now,
        passedAt: now,
        tx,
      });
      await this.emitValidationPassedEvent(tx, result, actorUserId);
    });
    await this.automation.handleActionChanged({
      incidentKey: result.incidentKey,
    });
  }

  private async markValidationFailedAndReopen(
    result: SystemTestIncidentValidationResult,
    actorUserId?: string | null,
  ): Promise<void> {
    const now = new Date();
    const row = await this.prisma.systemTestIncidentAction.findUnique({
      where: { incidentKey: result.incidentKey },
    });
    const nextReopen = (row?.reopenCount ?? 0) + 1;

    await this.prisma.$transaction(async (tx) => {
      await this.actions.setValidationState({
        incidentKey: result.incidentKey,
        validationState: "failed",
        checkedAt: now,
        failedAt: now,
        incrementReopenCount: true,
        reopenedAt: now,
        tx,
      });

      await this.emitValidationFailedEvent(tx, result, actorUserId);

      await this.actions.recordLifecycleEvent({
        incidentKey: result.incidentKey,
        type: "reopened",
        actorUserId,
        metadataJson: {
          reason: "validation_failed_reopened",
          runId: result.latestRunId,
          reopenCount: nextReopen,
        },
        tx,
      });

      await this.actions.transitionStatusInternal({
        incidentKey: result.incidentKey,
        nextStatus: "fixing",
        actorUserId,
        reason: "validation_failed_reopened",
        skipTransitionValidation: true,
        clearResolvedAt: true,
        tx,
      });
    });
    await this.automation.emitLifecycleNotificationQueued({
      incidentKey: result.incidentKey,
      reason: "validation_failed",
      runId: result.latestRunId ?? undefined,
    });
    await this.automation.handleActionChanged({
      incidentKey: result.incidentKey,
    });
  }

  private async emitValidationPassedEvent(
    tx: Prisma.TransactionClient,
    result: SystemTestIncidentValidationResult,
    actorUserId?: string | null,
  ): Promise<void> {
    await this.actions.recordLifecycleEvent({
      incidentKey: result.incidentKey,
      type: "validation_passed",
      actorUserId,
      metadataJson: {
        reason: result.reason,
        runId: result.latestRunId,
        currentGapRuns: result.currentGapRuns,
        reappearedAfterGap: result.reappearedAfterGap,
        trendDelta: result.trendDelta ?? 0,
      },
      tx,
    });
  }

  private async emitValidationFailedEvent(
    tx: Prisma.TransactionClient,
    result: SystemTestIncidentValidationResult,
    actorUserId?: string | null,
  ): Promise<void> {
    await this.actions.recordLifecycleEvent({
      incidentKey: result.incidentKey,
      type: "validation_failed",
      actorUserId,
      metadataJson: {
        reason: result.reason,
        runId: result.latestRunId,
        currentGapRuns: result.currentGapRuns,
        reappearedAfterGap: result.reappearedAfterGap,
        trendDelta: result.trendDelta ?? 0,
      },
      tx,
    });
  }

  private async emitIncidentSeenEvent(params: {
    incidentKey: string;
    runId: string;
    previousLastSeenRunId: string | null;
    currentStatus: string;
    actorUserId?: string | null;
  }): Promise<void> {
    await this.actions.recordLifecycleEvent({
      incidentKey: params.incidentKey,
      type: "incident_seen",
      actorUserId: params.actorUserId,
      metadataJson: {
        runId: params.runId,
        previousLastSeenRunId: params.previousLastSeenRunId,
        currentStatus: params.currentStatus,
      },
    });
  }
}
