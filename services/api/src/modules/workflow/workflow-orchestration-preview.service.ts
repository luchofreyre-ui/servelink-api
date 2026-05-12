import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma";
import { getTransition } from "../bookings/booking-state.machine";
import type { Transition } from "../bookings/booking-state.machine";
import type { WorkflowExecutionMode } from "./workflow-execution-modes";
import { WORKFLOW_EXECUTION_MODE } from "./workflow-execution-modes";
import { WorkflowGovernanceExecutionGuard } from "./workflow-governance-execution.guard";
import type { OperationalRecommendation } from "./workflow-operational-digest.service";
import { WorkflowOperationalDigestService } from "./workflow-operational-digest.service";
import {
  WORKFLOW_APPROVAL_RECORD_STATE,
  WORKFLOW_APPROVAL_TYPE_BOOKING_TRANSITION_INVOKE_V1,
  WORKFLOW_STEP_STATE,
} from "./workflow.constants";
import {
  ORCHESTRATION_DRY_RUN_RESULT_VERSION,
  WORKFLOW_DRY_RUN_PREVIEW_STATE,
} from "./workflow-orchestration-preview.constants";

const ALLOWED_TRANSITION = new Set<string>([
  "schedule",
  "assign",
  "start",
  "complete",
  "cancel",
  "reopen",
]);

function parseTransitionRaw(raw: unknown): Transition | null {
  if (typeof raw !== "string" || !ALLOWED_TRANSITION.has(raw)) {
    return null;
  }
  return raw as Transition;
}

export type OrchestrationDryRunTimelineEntry = {
  kind: string;
  detail: string;
  atIso: string;
};

export type GovernanceStepSimulationRow = {
  label: string;
  ok: boolean;
  outcome: string;
  reason?: string;
};

/**
 * Deterministic orchestration previews — no coordinator advancement, no booking/dispatch/billing mutation.
 */
@Injectable()
export class WorkflowOrchestrationPreviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly governance: WorkflowGovernanceExecutionGuard,
    private readonly digest: WorkflowOperationalDigestService,
  ) {}

  async listDryRunsForExecution(workflowExecutionId: string, take = 25) {
    const wfId = workflowExecutionId.trim();
    if (!wfId) {
      throw new BadRequestException("workflowExecutionId is required");
    }
    const rows = await this.prisma.workflowDryRunExecution.findMany({
      where: { workflowExecutionId: wfId },
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(take, 1), 100),
    });
    return rows;
  }

  async runDryRun(params: {
    workflowExecutionId: string;
    previewCategory?: string;
    recommendationKey?: string | null;
    idempotencyKey?: string | null;
    requestedByUserId?: string | null;
  }): Promise<{
    replay: boolean;
    dryRunId: string;
    previewState: string;
    resultJson: unknown;
  }> {
    const wfId = params.workflowExecutionId.trim();
    if (!wfId) {
      throw new BadRequestException("workflowExecutionId is required");
    }

    const category = (
      params.previewCategory ?? "orchestration_surface_admin_v1"
    ).trim();
    const idem = params.idempotencyKey?.trim() || null;

    if (idem) {
      const existing = await this.prisma.workflowDryRunExecution.findUnique({
        where: { idempotencyKey: idem },
      });
      if (existing) {
        if (existing.workflowExecutionId !== wfId) {
          throw new BadRequestException("IDEMPOTENCY_KEY_SCOPE_MISMATCH");
        }
        return {
          replay: true,
          dryRunId: existing.id,
          previewState: existing.previewState,
          resultJson: existing.resultJson,
        };
      }
    }

    const wf = await this.prisma.workflowExecution.findUnique({
      where: { id: wfId },
      include: {
        steps: { orderBy: { createdAt: "asc" } },
        approvals: { orderBy: { requestedAt: "desc" }, take: 25 },
      },
    });
    if (!wf) {
      throw new NotFoundException("WORKFLOW_EXECUTION_NOT_FOUND");
    }

    try {
      const built = await this.buildDryRunResultJson({
        wf,
        category,
        recommendationKey: params.recommendationKey?.trim() ?? null,
      });

      const row = await this.prisma.workflowDryRunExecution.create({
        data: {
          workflowExecutionId: wf.id,
          previewCategory: category,
          previewState: WORKFLOW_DRY_RUN_PREVIEW_STATE.COMPLETED,
          recommendationKey: params.recommendationKey?.trim() || null,
          idempotencyKey: idem,
          requestedByUserId: params.requestedByUserId?.trim() || null,
          payloadJson: {
            previewCategory: category,
            recommendationKey: params.recommendationKey ?? null,
          } as Prisma.InputJsonValue,
          resultJson: built as Prisma.InputJsonValue,
        },
      });

      return {
        replay: false,
        dryRunId: row.id,
        previewState: row.previewState,
        resultJson: row.resultJson,
      };
    } catch (e) {
      const errMsg =
        e instanceof Error ? e.message.slice(0, 512) : "dry_run_failed";
      const failurePayload = {
        version: ORCHESTRATION_DRY_RUN_RESULT_VERSION,
        workflowExecutionId: wf.id,
        previewCategory: category,
        previewError: errMsg,
        simulationOnly: true,
        noAutonomousExecution: true,
      };

      const row = await this.prisma.workflowDryRunExecution.create({
        data: {
          workflowExecutionId: wf.id,
          previewCategory: category,
          previewState: WORKFLOW_DRY_RUN_PREVIEW_STATE.FAILED,
          recommendationKey: params.recommendationKey?.trim() || null,
          idempotencyKey: idem,
          requestedByUserId: params.requestedByUserId?.trim() || null,
          payloadJson: {
            previewCategory: category,
            recommendationKey: params.recommendationKey ?? null,
          } as Prisma.InputJsonValue,
          resultJson: failurePayload as Prisma.InputJsonValue,
        },
      });

      return {
        replay: false,
        dryRunId: row.id,
        previewState: row.previewState,
        resultJson: row.resultJson,
      };
    }
  }

  private async buildDryRunResultJson(params: {
    wf: {
      id: string;
      workflowType: string;
      aggregateType: string;
      aggregateId: string;
      state: string;
      executionMode: string;
      approvalState: string | null;
      steps: Array<{ stepType: string; state: string }>;
      approvals: Array<{
        approvalType: string;
        approvalState: string;
        payloadJson: Prisma.JsonValue;
      }>;
    };
    category: string;
    recommendationKey: string | null;
  }): Promise<Record<string, unknown>> {
    const { wf } = params;
    const timeline: OrchestrationDryRunTimelineEntry[] = [];
    const warnings: string[] = [];
    const impact: string[] = [];

    const nowIso = new Date().toISOString();
    timeline.push({
      kind: "load_execution",
      detail: `Loaded workflow ${wf.workflowType} state=${wf.state}`,
      atIso: nowIso,
    });

    const pendingStep =
      wf.steps.find((s) => s.state === WORKFLOW_STEP_STATE.PENDING) ?? null;

    const governanceRows: GovernanceStepSimulationRow[] = [];
    if (pendingStep) {
      const mode = wf.executionMode as WorkflowExecutionMode;
      const actual = this.governance.evaluate({
        mode,
        stepType: pendingStep.stepType,
        approvalState: wf.approvalState,
      });
      const dryRunEval = this.governance.evaluate({
        mode: WORKFLOW_EXECUTION_MODE.DRY_RUN,
        stepType: pendingStep.stepType,
        approvalState: wf.approvalState,
      });
      governanceRows.push({
        label: `Recorded engine mode (${mode})`,
        ok: actual.ok,
        outcome: actual.outcome,
        reason: actual.reason,
      });
      governanceRows.push({
        label: "Hypothetical dry_run governance trace",
        ok: dryRunEval.ok,
        outcome: dryRunEval.outcome,
        reason: dryRunEval.reason,
      });
      impact.push(
        `Pending step ${pendingStep.stepType}: under recorded mode governance outcome=${actual.outcome}${actual.reason ? ` (${actual.reason})` : ""}.`,
      );
      timeline.push({
        kind: "governance_simulation",
        detail: `Evaluated governance for pending step ${pendingStep.stepType}`,
        atIso: new Date().toISOString(),
      });
    } else {
      impact.push(
        "No pending workflow steps in deterministic ordering — coordinator would not pick a new runnable step from this snapshot.",
      );
      timeline.push({
        kind: "no_pending_step",
        detail: "No step rows in pending state",
        atIso: new Date().toISOString(),
      });
    }

    let surfaceSnapshot: Record<string, unknown> | null = null;
    let matchedRecommendation: OperationalRecommendation | null = null;

    if (wf.aggregateType === "booking") {
      const bookingId = wf.aggregateId;
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        select: {
          status: true,
          paymentStatus: true,
          recurringPlans: { select: { id: true }, take: 1 },
        },
      });
      if (booking) {
        const surface = await this.digest.buildRoleScopedSurface({
          bookingId,
          viewerRole: "admin",
          bookingPaymentStatus: booking.paymentStatus,
          bookingStatus: booking.status,
          hasRecurringPlan: booking.recurringPlans.length > 0,
        });
        surfaceSnapshot = {
          digest: surface.digest,
          deterministicRecommendationIds: surface.deterministicRecommendations.map(
            (r) => r.id,
          ),
          policyEvaluationKeys: surface.policyEvaluations.map((p) => p.policyKey),
          timingSummary: {
            pendingTimers: surface.timingSurface.pendingTimers.length,
            waitStates: surface.timingSurface.waitStates.length,
          },
        };
        if (params.recommendationKey) {
          matchedRecommendation =
            surface.deterministicRecommendations.find(
              (r) => r.id === params.recommendationKey,
            ) ?? null;
          if (!matchedRecommendation) {
            warnings.push(
              `Recommendation key "${params.recommendationKey}" not present on current deterministic surface.`,
            );
          }
        }
        timeline.push({
          kind: "surface_snapshot",
          detail: "Merged admin orchestration digest (read-only projection)",
          atIso: new Date().toISOString(),
        });

        const approvedInvoke = wf.approvals.find(
          (a) =>
            a.approvalType ===
              WORKFLOW_APPROVAL_TYPE_BOOKING_TRANSITION_INVOKE_V1 &&
            a.approvalState === WORKFLOW_APPROVAL_RECORD_STATE.APPROVED,
        );
        if (approvedInvoke) {
          const payload = approvedInvoke.payloadJson as {
            transition?: unknown;
            bookingId?: string;
          };
          const transition = parseTransitionRaw(payload?.transition);
          const bid = payload?.bookingId?.trim();
          if (bid === bookingId && transition) {
            try {
              const next = getTransition(transition, booking.status);
              impact.push(
                `Approved booking-transition proposal (preview): "${transition}" from ${booking.status} resolves to ${next.to} — invocation remains a separate explicit admin action.`,
              );
              timeline.push({
                kind: "booking_transition_preview",
                detail: `Validated transition "${transition}" against booking status ${booking.status}`,
                atIso: new Date().toISOString(),
              });
            } catch {
              warnings.push(
                `Approved invoke references transition "${String(payload?.transition)}" which does not apply to current booking status ${booking.status}.`,
              );
            }
          } else {
            warnings.push(
              "Approved booking-transition approval payload missing aligned bookingId or valid transition token.",
            );
          }
        }
      } else {
        warnings.push("Booking aggregate not found — digest projection skipped.");
      }
    } else {
      warnings.push(
        `Non-booking aggregate (${wf.aggregateType}) — digest projection skipped.`,
      );
    }

    return {
      version: ORCHESTRATION_DRY_RUN_RESULT_VERSION,
      workflowExecutionId: wf.id,
      previewCategory: params.category,
      recommendationKey: params.recommendationKey,
      simulationTimeline: timeline,
      governancePreview: {
        pendingStepType: pendingStep?.stepType ?? null,
        rows: governanceRows,
      },
      surfaceSnapshot,
      matchedRecommendation,
      operationalImpactSummary: impact,
      warnings,
      simulationOnly: true,
      noAutonomousExecution: true,
    };
  }
}
