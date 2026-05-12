import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma";
import {
  WORKFLOW_ACTIVATION_STATE,
} from "../orchestration/workflow-execution-activation.constants";
import {
  WORKFLOW_APPROVAL_RECORD_STATE,
  WORKFLOW_APPROVAL_TYPE_BOOKING_TRANSITION_INVOKE_V1,
  WORKFLOW_EXECUTION_STAGE,
  WORKFLOW_EXECUTION_STATE,
  WORKFLOW_STEP_STATE,
} from "./workflow.constants";
import {
  OPERATIONAL_SAFETY_EVALUATION_CATEGORY,
  OPERATIONAL_SAFETY_SEVERITY,
  ORCHESTRATION_SIMULATION_RESULT_VERSION,
  WORKFLOW_SIMULATION_SCENARIO_CATEGORY,
  WORKFLOW_SIMULATION_STATE,
} from "./workflow-orchestration-simulation.constants";
import { WORKFLOW_TIMER_STATE, WORKFLOW_WAIT_STATE } from "./workflow-timing.constants";

type SafetySpec = {
  evaluationCategory: string;
  severity: string;
  explanation: string;
  payload: Record<string, unknown>;
};

type ActivationFocusRow = {
  id: string;
  workflowExecutionId: string;
  activationState: string;
  activationCategory: string;
  createdAt: Date;
};

/**
 * Deterministic orchestration simulation — persists observations only; never mutates workflows or bookings.
 */
@Injectable()
export class WorkflowOrchestrationSimulationService {
  constructor(private readonly prisma: PrismaService) {}

  async listScenarios(workflowExecutionId: string, take = 30) {
    const wfId = workflowExecutionId.trim();
    if (!wfId) throw new BadRequestException("workflowExecutionId is required");
    return this.prisma.workflowSimulationScenario.findMany({
      where: { workflowExecutionId: wfId },
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(take, 1), 80),
    });
  }

  async listSafetyEvaluations(workflowExecutionId: string, take = 50) {
    const wfId = workflowExecutionId.trim();
    if (!wfId) throw new BadRequestException("workflowExecutionId is required");
    return this.prisma.operationalSafetyEvaluation.findMany({
      where: { workflowExecutionId: wfId },
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(take, 1), 120),
    });
  }

  async runScenario(params: {
    workflowExecutionId: string;
    scenarioCategory: string;
    activationId?: string | null;
    requestedByUserId?: string | null;
    idempotencyKey?: string | null;
  }): Promise<{
    replay: boolean;
    scenarioId: string;
    simulationState: string;
    resultJson: unknown;
  }> {
    const wfId = params.workflowExecutionId.trim();
    const cat = params.scenarioCategory.trim();
    const idem = params.idempotencyKey?.trim() || null;

    if (!wfId || !cat) {
      throw new BadRequestException("workflowExecutionId and scenarioCategory are required");
    }

    if (
      cat !== WORKFLOW_SIMULATION_SCENARIO_CATEGORY.ORCHESTRATION_SAFETY_SNAPSHOT_V1 &&
      cat !== WORKFLOW_SIMULATION_SCENARIO_CATEGORY.ACTIVATION_FOCUS_V1
    ) {
      throw new BadRequestException("UNSUPPORTED_SIMULATION_SCENARIO_CATEGORY");
    }

    if (idem) {
      const existing = await this.prisma.workflowSimulationScenario.findUnique({
        where: { idempotencyKey: idem },
      });
      if (existing) {
        if (existing.workflowExecutionId !== wfId || existing.scenarioCategory !== cat) {
          throw new BadRequestException("IDEMPOTENCY_KEY_SCOPE_MISMATCH");
        }
        return {
          replay: true,
          scenarioId: existing.id,
          simulationState: existing.simulationState,
          resultJson: existing.resultJson,
        };
      }
    }

    let activationId: string | null = params.activationId?.trim() || null;
    if (
      cat === WORKFLOW_SIMULATION_SCENARIO_CATEGORY.ACTIVATION_FOCUS_V1 &&
      !activationId
    ) {
      throw new BadRequestException("activationId required for activation_focus_v1");
    }

    const wf = await this.prisma.workflowExecution.findUnique({
      where: { id: wfId },
      include: {
        timers: { where: { timerState: WORKFLOW_TIMER_STATE.PENDING } },
        waitStates: true,
        approvals: { orderBy: { requestedAt: "desc" }, take: 20 },
        activations: { orderBy: { createdAt: "desc" }, take: 25 },
        steps: {
          where: { state: WORKFLOW_STEP_STATE.PENDING },
          orderBy: { createdAt: "asc" },
          take: 3,
        },
        policyEvaluations: {
          orderBy: { createdAt: "desc" },
          take: 24,
        },
      },
    });

    if (!wf) {
      throw new NotFoundException("WORKFLOW_EXECUTION_NOT_FOUND");
    }

    let activationFocus: ActivationFocusRow | null = null;
    if (activationId) {
      activationFocus = await this.prisma.workflowExecutionActivation.findUnique({
        where: { id: activationId },
      });
      if (
        !activationFocus ||
        activationFocus.workflowExecutionId !== wf.id
      ) {
        throw new BadRequestException("ACTIVATION_SCOPE_MISMATCH");
      }
    }

    try {
      const specs = await this.buildSafetySpecs({
        wf,
        scenarioCategory: cat,
        activationFocus,
      });

      const attention = specs.filter(
        (s) => s.severity === OPERATIONAL_SAFETY_SEVERITY.ATTENTION,
      ).length;
      const info = specs.filter(
        (s) => s.severity === OPERATIONAL_SAFETY_SEVERITY.INFO,
      ).length;

      const result = await this.prisma.$transaction(async (tx) => {
        const scenario = await tx.workflowSimulationScenario.create({
          data: {
            scenarioCategory: cat,
            workflowExecutionId: wf.id,
            activationId,
            simulationState: WORKFLOW_SIMULATION_STATE.COMPLETED,
            requestedByUserId: params.requestedByUserId?.trim() || null,
            idempotencyKey: idem,
            payloadJson: {
              scenarioCategory: cat,
              activationId,
            } as Prisma.InputJsonValue,
            resultJson: {} as Prisma.InputJsonValue,
          },
        });

        const evaluationRows = await Promise.all(
          specs.map((s) =>
            tx.operationalSafetyEvaluation.create({
              data: {
                workflowExecutionId: wf.id,
                simulationScenarioId: scenario.id,
                evaluationCategory: s.evaluationCategory,
                severity: s.severity,
                explanation: s.explanation,
                payloadJson: s.payload as Prisma.InputJsonValue,
              },
              select: { id: true },
            }),
          ),
        );

        const resultJson = {
          version: ORCHESTRATION_SIMULATION_RESULT_VERSION,
          workflowExecutionId: wf.id,
          scenarioCategory: cat,
          activationId,
          simulationOnly: true,
          noAutonomousExecution: true,
          evaluationSummary: {
            attention,
            info,
            total: specs.length,
          },
          evaluationIds: evaluationRows.map((r) => r.id),
        };

        await tx.workflowSimulationScenario.update({
          where: { id: scenario.id },
          data: { resultJson: resultJson as Prisma.InputJsonValue },
        });

        return { scenarioId: scenario.id, resultJson };
      });

      return {
        replay: false,
        scenarioId: result.scenarioId,
        simulationState: WORKFLOW_SIMULATION_STATE.COMPLETED,
        resultJson: result.resultJson,
      };
    } catch (e) {
      const errMsg =
        e instanceof Error ? e.message.slice(0, 480) : "simulation_failed";
      const row = await this.prisma.workflowSimulationScenario.create({
        data: {
          scenarioCategory: cat,
          workflowExecutionId: wf.id,
          activationId,
          simulationState: WORKFLOW_SIMULATION_STATE.FAILED,
          requestedByUserId: params.requestedByUserId?.trim() || null,
          idempotencyKey: idem,
          payloadJson: {
            scenarioCategory: cat,
            activationId,
          } as Prisma.InputJsonValue,
          resultJson: {
            version: ORCHESTRATION_SIMULATION_RESULT_VERSION,
            error: errMsg,
            simulationOnly: true,
          } as Prisma.InputJsonValue,
        },
      });
      return {
        replay: false,
        scenarioId: row.id,
        simulationState: WORKFLOW_SIMULATION_STATE.FAILED,
        resultJson: row.resultJson,
      };
    }
  }

  private async buildSafetySpecs(params: {
    wf: Prisma.WorkflowExecutionGetPayload<{
      include: {
        timers: true;
        waitStates: true;
        approvals: true;
        activations: true;
        steps: true;
        policyEvaluations: true;
      };
    }>;
    scenarioCategory: string;
    activationFocus: ActivationFocusRow | null;
  }): Promise<SafetySpec[]> {
    const specs: SafetySpec[] = [];
    const wf = params.wf;
    const now = Date.now();
    const since24h = new Date(now - 24 * 60 * 60 * 1000);

    if (wf.state === WORKFLOW_EXECUTION_STATE.WAITING_APPROVAL) {
      specs.push({
        evaluationCategory: OPERATIONAL_SAFETY_EVALUATION_CATEGORY.WORKFLOW_POSTURE,
        severity: OPERATIONAL_SAFETY_SEVERITY.ATTENTION,
        explanation:
          "Workflow is paused awaiting explicit approval — no autonomous continuation from simulation.",
        payload: { state: wf.state, executionMode: wf.executionMode },
      });
    }

    if (
      wf.state === WORKFLOW_EXECUTION_STATE.FAILED &&
      wf.executionStage === WORKFLOW_EXECUTION_STAGE.GOVERNANCE_BLOCKED
    ) {
      specs.push({
        evaluationCategory: OPERATIONAL_SAFETY_EVALUATION_CATEGORY.WORKFLOW_POSTURE,
        severity: OPERATIONAL_SAFETY_SEVERITY.ATTENTION,
        explanation:
          "Governance blocked this execution — inspect steps before any activation.",
        payload: {
          state: wf.state,
          executionStage: wf.executionStage,
          failureReason: wf.failureReason,
        },
      });
    }

    const overdueTimers = wf.timers.filter(
      (t) => t.wakeAt.getTime() <= now,
    ).length;
    if (overdueTimers > 0) {
      specs.push({
        evaluationCategory: OPERATIONAL_SAFETY_EVALUATION_CATEGORY.TIMER_WAIT_PRESSURE,
        severity: OPERATIONAL_SAFETY_SEVERITY.ATTENTION,
        explanation: `${overdueTimers} pending timer(s) are past wakeAt — visibility backlog without autonomous mutation.`,
        payload: { overdueTimers },
      });
    }

    const expiredWaits = wf.waitStates.filter(
      (w) => w.waitState === WORKFLOW_WAIT_STATE.EXPIRED_VISIBILITY,
    ).length;
    if (expiredWaits > 0) {
      specs.push({
        evaluationCategory: OPERATIONAL_SAFETY_EVALUATION_CATEGORY.TIMER_WAIT_PRESSURE,
        severity: OPERATIONAL_SAFETY_SEVERITY.ATTENTION,
        explanation: `${expiredWaits} expired visibility wait row(s) — escalation posture signal only.`,
        payload: { expiredVisibilityWaits: expiredWaits },
      });
    }

    const pendingApprovals = wf.approvals.filter(
      (a) => a.approvalState === WORKFLOW_APPROVAL_RECORD_STATE.PENDING,
    ).length;
    if (pendingApprovals > 0) {
      specs.push({
        evaluationCategory: OPERATIONAL_SAFETY_EVALUATION_CATEGORY.APPROVAL_INVENTORY,
        severity: OPERATIONAL_SAFETY_SEVERITY.INFO,
        explanation: `${pendingApprovals} approval row(s) still pending on this execution.`,
        payload: { pendingApprovals },
      });
    }

    const invokeApprovedNoInvoke = wf.approvals.filter(
      (a) =>
        a.approvalType === WORKFLOW_APPROVAL_TYPE_BOOKING_TRANSITION_INVOKE_V1 &&
        a.approvalState === WORKFLOW_APPROVAL_RECORD_STATE.APPROVED,
    );
    for (const ap of invokeApprovedNoInvoke) {
      const meta = (ap.metadataJson ?? {}) as {
        bookingTransitionInvokedAt?: string;
      };
      const expired =
        ap.expiresAt != null && ap.expiresAt.getTime() < now;
      if (!meta.bookingTransitionInvokedAt) {
        specs.push({
          evaluationCategory: OPERATIONAL_SAFETY_EVALUATION_CATEGORY.APPROVAL_INVENTORY,
          severity:
            expired ?
              OPERATIONAL_SAFETY_SEVERITY.ATTENTION
            : OPERATIONAL_SAFETY_SEVERITY.INFO,
          explanation:
            expired ?
              "Approved booking-transition invoke approval appears expired without invoke timestamp recorded."
            : "Approved booking-transition invoke exists — Servelink still requires explicit guided activation + invocation.",
          payload: {
            workflowApprovalId: ap.id,
            expiresAt: ap.expiresAt?.toISOString() ?? null,
          },
        });
      }
    }

    for (const ev of wf.policyEvaluations) {
      if (ev.evaluationResult === "pass") continue;
      const sev =
        ev.severity === "high" || ev.severity === "medium" ?
          OPERATIONAL_SAFETY_SEVERITY.ATTENTION
        : OPERATIONAL_SAFETY_SEVERITY.INFO;
      specs.push({
        evaluationCategory: OPERATIONAL_SAFETY_EVALUATION_CATEGORY.POLICY_SIGNAL,
        severity: sev,
        explanation: `${ev.policyKey}: ${ev.explanation}`,
        payload: {
          policyKey: ev.policyKey,
          evaluationResult: ev.evaluationResult,
          severity: ev.severity,
        },
      });
    }

    for (const act of wf.activations) {
      if (act.activationState === WORKFLOW_ACTIVATION_STATE.FAILED) {
        specs.push({
          evaluationCategory: OPERATIONAL_SAFETY_EVALUATION_CATEGORY.ACTIVATION_CHAIN,
          severity: OPERATIONAL_SAFETY_SEVERITY.ATTENTION,
          explanation:
            "An activation row recorded FAILED — review adapter outcome before retrying governance.",
          payload: {
            activationId: act.id,
            activationState: act.activationState,
          },
        });
      } else if (
        act.activationState === WORKFLOW_ACTIVATION_STATE.REGISTERED &&
        act.createdAt.getTime() < now - 24 * 60 * 60 * 1000
      ) {
        specs.push({
          evaluationCategory: OPERATIONAL_SAFETY_EVALUATION_CATEGORY.ACTIVATION_CHAIN,
          severity: OPERATIONAL_SAFETY_SEVERITY.INFO,
          explanation:
            "Activation registered >24h without second-operator approval — deterministic staleness signal only.",
          payload: {
            activationId: act.id,
            activationState: act.activationState,
          },
        });
      }
    }

    if (params.scenarioCategory === WORKFLOW_SIMULATION_SCENARIO_CATEGORY.ACTIVATION_FOCUS_V1 && params.activationFocus) {
      const a = params.activationFocus;
      specs.push({
        evaluationCategory: OPERATIONAL_SAFETY_EVALUATION_CATEGORY.ACTIVATION_CHAIN,
        severity: OPERATIONAL_SAFETY_SEVERITY.INFO,
        explanation: `Focused activation ${a.id} state=${a.activationCategory}/${a.activationState}.`,
        payload: {
          activationId: a.id,
          activationState: a.activationState,
          activationCategory: a.activationCategory,
        },
      });
    }

    if (wf.triggeringOutboxEventId) {
      const attempts =
        await this.prisma.operationalOutboxDeliveryAttempt.findMany({
          where: {
            outboxEventId: wf.triggeringOutboxEventId,
            createdAt: { gte: since24h },
          },
          select: { success: true },
          take: 500,
        });
      const successes = attempts.filter((x) => x.success).length;
      const n = attempts.length;
      if (
        n > 8 &&
        successes < Math.ceil(n * 0.85)
      ) {
        specs.push({
          evaluationCategory: OPERATIONAL_SAFETY_EVALUATION_CATEGORY.DELIVERY_MIRROR,
          severity: OPERATIONAL_SAFETY_SEVERITY.ATTENTION,
          explanation:
            "Linked outbox delivery attempts (24h) show <85% successes — operational channel pressure mirror only.",
          payload: {
            attempts: n,
            successes,
            triggeringOutboxEventId: wf.triggeringOutboxEventId,
          },
        });
      } else if (n > 0) {
        specs.push({
          evaluationCategory: OPERATIONAL_SAFETY_EVALUATION_CATEGORY.DELIVERY_MIRROR,
          severity: OPERATIONAL_SAFETY_SEVERITY.INFO,
          explanation:
            "Linked outbox delivery attempts observed for workflow correlation — deterministic mirror.",
          payload: {
            attempts: n,
            successes,
          },
        });
      }
    }

    if (specs.length === 0) {
      specs.push({
        evaluationCategory: OPERATIONAL_SAFETY_EVALUATION_CATEGORY.WORKFLOW_POSTURE,
        severity: OPERATIONAL_SAFETY_SEVERITY.INFO,
        explanation:
          "No attention-tier orchestration pressure matched deterministic simulation gates on this snapshot.",
        payload: { state: wf.state },
      });
    }

    return specs;
  }
}
