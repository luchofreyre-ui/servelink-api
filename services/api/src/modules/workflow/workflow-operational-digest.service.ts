import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma";
import {
  WORKFLOW_APPROVAL_RECORD_STATE,
  WORKFLOW_APPROVAL_TYPE_BOOKING_TRANSITION_INVOKE_V1,
  WORKFLOW_APPROVAL_TYPE_ORCHESTRATION_GATE_V1,
  WORKFLOW_EXECUTION_STAGE,
  WORKFLOW_EXECUTION_STATE,
  WORKFLOW_STEP_TYPE_ENRICH_OPERATIONAL_TRACE_V1,
  WORKFLOW_STEP_TYPE_OBSERVE_DELIVERY_PIPELINE,
  WORKFLOW_STEP_TYPE_ORCHESTRATION_APPROVAL_GATE_V1,
  WORKFLOW_STEP_TYPE_RECORD_ORCHESTRATION_APPROVAL_RESOLUTION_V1,
} from "./workflow.constants";
import { OperationalPolicyEvaluationService } from "./operational-policy-evaluation.service";
import { WORKFLOW_WAIT_STATE } from "./workflow-timing.constants";

export type WorkflowOperationalDigestRow = {
  hasWorkflow: boolean;
  workflowExecutionId: string | null;
  workflowType: string | null;
  state: string | null;
  executionStage: string | null;
  executionMode: string | null;
  approvalState: string | null;
  updatedAt: string | null;
  waitingOnApproval: boolean;
  governanceBlocked: boolean;
  completedSuccessfully: boolean;
  headlineCustomer: string;
  headlineFo: string;
  headlineAdmin: string;
  stepsDigest: Array<{ stepType: string; state: string; label: string }>;
  approvalsDigest: Array<{
    approvalType: string;
    state: string;
    headline: string;
  }>;
};

export type OperationalRecommendation = {
  id: string;
  severity: "info" | "attention";
  title: string;
  detail: string;
};

export type OperationalPolicyEvaluationSurfaceRow = {
  policyCategory: string;
  policyKey: string;
  evaluationResult: string;
  severity: string;
  explanation: string;
  createdAt: string;
};

export type OperationalTimingSurfaceRow = {
  pendingTimers: Array<{
    timerType: string;
    timerState: string;
    wakeAt: string;
    triggeredAt: string | null;
    dedupeKey: string;
  }>;
  waitStates: Array<{
    waitCategory: string;
    waitState: string;
    waitingOn: string;
    expiresAt: string | null;
    resolvedAt: string | null;
  }>;
};

function stepLabel(stepType: string): string {
  switch (stepType) {
    case WORKFLOW_STEP_TYPE_OBSERVE_DELIVERY_PIPELINE:
      return "Recorded operational delivery signal";
    case WORKFLOW_STEP_TYPE_ENRICH_OPERATIONAL_TRACE_V1:
      return "Enriched operational audit trace";
    case WORKFLOW_STEP_TYPE_ORCHESTRATION_APPROVAL_GATE_V1:
      return "Human approval checkpoint";
    case WORKFLOW_STEP_TYPE_RECORD_ORCHESTRATION_APPROVAL_RESOLUTION_V1:
      return "Recorded approval resolution";
    default:
      return stepType.replace(/_/g, " ");
  }
}

function approvalHeadline(
  approvalType: string,
  state: string,
): string {
  if (approvalType === WORKFLOW_APPROVAL_TYPE_ORCHESTRATION_GATE_V1) {
    if (state === WORKFLOW_APPROVAL_RECORD_STATE.PENDING) {
      return "Visit coordination awaits internal approval";
    }
    if (state === WORKFLOW_APPROVAL_RECORD_STATE.APPROVED) {
      return "Internal coordination checkpoint approved";
    }
    if (state === WORKFLOW_APPROVAL_RECORD_STATE.DENIED) {
      return "Internal coordination checkpoint declined — Servelink will follow up";
    }
  }
  if (approvalType === WORKFLOW_APPROVAL_TYPE_BOOKING_TRANSITION_INVOKE_V1) {
    if (state === WORKFLOW_APPROVAL_RECORD_STATE.PENDING) {
      return "Booking change proposal awaits operator approval";
    }
    if (state === WORKFLOW_APPROVAL_RECORD_STATE.APPROVED) {
      return "Approved booking change proposal — invoke runs separately";
    }
    if (state === WORKFLOW_APPROVAL_RECORD_STATE.DENIED) {
      return "Booking change proposal was declined";
    }
  }
  return `${approvalType} (${state})`;
}

function emptyDigest(): WorkflowOperationalDigestRow {
  return {
    hasWorkflow: false,
    workflowExecutionId: null,
    workflowType: null,
    state: null,
    executionStage: null,
    executionMode: null,
    approvalState: null,
    updatedAt: null,
    waitingOnApproval: false,
    governanceBlocked: false,
    completedSuccessfully: false,
    headlineCustomer:
      "When Servelink records operational signals for this visit, a short summary will appear here.",
    headlineFo:
      "No governed workflow row for this booking yet — deliveries still commit normally.",
    headlineAdmin:
      "No WorkflowExecution rows for this booking aggregate yet (observe workflows spawn after outbox delivery).",
    stepsDigest: [],
    approvalsDigest: [],
  };
}

@Injectable()
export class WorkflowOperationalDigestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policyEvaluation: OperationalPolicyEvaluationService,
  ) {}

  async buildDigestsForBookingIds(
    bookingIds: string[],
  ): Promise<Map<string, WorkflowOperationalDigestRow>> {
    const map = new Map<string, WorkflowOperationalDigestRow>();
    if (bookingIds.length === 0) return map;

    const executions = await this.prisma.workflowExecution.findMany({
      where: {
        aggregateType: "booking",
        aggregateId: { in: bookingIds },
      },
      orderBy: { createdAt: "desc" },
      include: {
        steps: { orderBy: { createdAt: "asc" }, take: 16 },
        approvals: {
          orderBy: { requestedAt: "desc" },
          take: 10,
        },
      },
    });

    const latestByBooking = new Map<
      string,
      (typeof executions)[number]
    >();
    for (const ex of executions) {
      if (!latestByBooking.has(ex.aggregateId)) {
        latestByBooking.set(ex.aggregateId, ex);
      }
    }

    for (const bid of bookingIds) {
      const ex = latestByBooking.get(bid);
      map.set(bid, ex ? this.toDigestRow(ex) : emptyDigest());
    }
    return map;
  }

  async buildRoleScopedSurface(params: {
    bookingId: string;
    viewerRole: string;
    bookingPaymentStatus?: string | null;
    bookingStatus?: string | null;
    hasRecurringPlan?: boolean;
  }): Promise<{
    digest: WorkflowOperationalDigestRow;
    deterministicRecommendations: OperationalRecommendation[];
    policyEvaluations: OperationalPolicyEvaluationSurfaceRow[];
    timingSurface: OperationalTimingSurfaceRow;
  }> {
    const digests = await this.buildDigestsForBookingIds([params.bookingId]);
    const digest =
      digests.get(params.bookingId) ?? emptyDigest();

    if (digest.workflowExecutionId) {
      try {
        await this.policyEvaluation.persistSnapshot(digest.workflowExecutionId);
      } catch {
        /* snapshot best-effort — coordinator also persists */
      }
    }

    const persistedPolicies = await this.policyEvaluation.listForExecution(
      digest.workflowExecutionId,
    );

    const [timerRows, waitRows] =
      digest.workflowExecutionId != null
        ? await Promise.all([
            this.prisma.workflowTimer.findMany({
              where: { workflowExecutionId: digest.workflowExecutionId },
              orderBy: { wakeAt: "asc" },
              take: 15,
              select: {
                timerType: true,
                timerState: true,
                wakeAt: true,
                triggeredAt: true,
                dedupeKey: true,
              },
            }),
            this.prisma.workflowWaitState.findMany({
              where: { workflowExecutionId: digest.workflowExecutionId },
              orderBy: { createdAt: "desc" },
              take: 15,
              select: {
                waitCategory: true,
                waitState: true,
                waitingOn: true,
                expiresAt: true,
                resolvedAt: true,
              },
            }),
          ])
        : [[], []];

    const timingSurface: OperationalTimingSurfaceRow = {
      pendingTimers: timerRows.map((t) => ({
        timerType: t.timerType,
        timerState: t.timerState,
        wakeAt: t.wakeAt.toISOString(),
        triggeredAt: t.triggeredAt?.toISOString() ?? null,
        dedupeKey: t.dedupeKey,
      })),
      waitStates: waitRows.map((w) => ({
        waitCategory: w.waitCategory,
        waitState: w.waitState,
        waitingOn: w.waitingOn,
        expiresAt: w.expiresAt?.toISOString() ?? null,
        resolvedAt: w.resolvedAt?.toISOString() ?? null,
      })),
    };

    const policyEvaluations: OperationalPolicyEvaluationSurfaceRow[] =
      persistedPolicies.map((p) => ({
        policyCategory: p.policyCategory,
        policyKey: p.policyKey,
        evaluationResult: p.evaluationResult,
        severity: p.severity,
        explanation: p.explanation,
        createdAt: p.createdAt.toISOString(),
      }));

    const recs: OperationalRecommendation[] = [];

    const headline =
      params.viewerRole === "customer"
        ? digest.headlineCustomer
        : params.viewerRole === "fo"
          ? digest.headlineFo
          : digest.headlineAdmin;

    recs.push({
      id: "orchestration_headline",
      severity: digest.waitingOnApproval || digest.governanceBlocked ? "attention" : "info",
      title: "Operational coordination",
      detail: headline,
    });

    if (digest.waitingOnApproval) {
      recs.push({
        id: "approval_pause",
        severity: "attention",
        title:
          params.viewerRole === "customer"
            ? "Brief internal pause"
            : "Approval gate active",
        detail:
          params.viewerRole === "customer"
            ? "Servelink may be confirming internal coordination before the next operational step. Your booking status on file still reflects what has already been committed."
            : "Workflow engine is waiting on an explicit human approval before continuing governed steps. No autonomous mutations run from this pause.",
      });
    }

    if (digest.governanceBlocked) {
      recs.push({
        id: "governance_block",
        severity: "attention",
        title: "Governance blocked a step",
        detail:
          "A governed workflow step was refused by safety rails. Operations should review the workflow timeline — there is no customer-facing automation from this state.",
      });
    }

    const ps = params.bookingPaymentStatus ?? "";
    if (
      ps === "unpaid" ||
      ps === "checkout_created" ||
      ps === "payment_pending" ||
      ps === "failed"
    ) {
      recs.push({
        id: "payment_attention",
        severity: "attention",
        title: "Payment needs attention",
        detail:
          "Checkout or authorization may still be required — confirmation always follows server payment status.",
      });
    }

    const pendingInvoke = digest.approvalsDigest.some(
      (a) =>
        a.approvalType === WORKFLOW_APPROVAL_TYPE_BOOKING_TRANSITION_INVOKE_V1 &&
        a.state === WORKFLOW_APPROVAL_RECORD_STATE.APPROVED,
    );
    if (
      pendingInvoke &&
      (params.viewerRole === "fo" || params.viewerRole === "admin")
    ) {
      recs.push({
        id: "approved_invoke_pending",
        severity: "info",
        title: "Approved booking-change proposal",
        detail:
          "An approved orchestration proposal exists; execution still requires an explicit admin invoke — nothing runs automatically.",
      });
    }

    if (params.hasRecurringPlan) {
      recs.push({
        id: "recurring_on_file",
        severity: "info",
        title: "Recurring context on file",
        detail:
          "This booking links to recurring metadata Servelink uses for continuity — cadence does not auto-change dispatch.",
      });
    }

    for (const p of policyEvaluations) {
      if (p.evaluationResult === "pass") continue;
      recs.push({
        id: `policy:${p.policyKey}`,
        severity:
          p.severity === "high" || p.severity === "medium"
            ? "attention"
            : "info",
        title: `Operational policy (${p.policyCategory})`,
        detail: `${p.policyKey}: ${p.explanation}`,
      });
    }

    const hasExpiredVisibilityWait = timingSurface.waitStates.some(
      (w) => w.waitState === WORKFLOW_WAIT_STATE.EXPIRED_VISIBILITY,
    );
    if (
      hasExpiredVisibilityWait &&
      (params.viewerRole === "fo" || params.viewerRole === "admin")
    ) {
      recs.push({
        id: "timing_approval_expired_visibility",
        severity: "attention",
        title: "Approval deadline visibility",
        detail:
          "A governed approval passed its recorded expiry window while still pending — Servelink surfaced escalation for operators; this does not auto-change booking or dispatch.",
      });
    }

    return {
      digest,
      deterministicRecommendations: recs,
      policyEvaluations,
      timingSurface:
        params.viewerRole === "customer"
          ? { pendingTimers: [], waitStates: [] }
          : timingSurface,
    };
  }

  private toDigestRow(
    ex: {
      id: string;
      workflowType: string;
      state: string;
      executionStage: string;
      executionMode: string;
      approvalState: string | null;
      updatedAt: Date;
      steps: Array<{ stepType: string; state: string }>;
      approvals: Array<{ approvalType: string; approvalState: string }>;
    },
  ): WorkflowOperationalDigestRow {
    const waitingOnApproval = ex.state === WORKFLOW_EXECUTION_STATE.WAITING_APPROVAL;
    const governanceBlocked =
      ex.state === WORKFLOW_EXECUTION_STATE.FAILED &&
      ex.executionStage === WORKFLOW_EXECUTION_STAGE.GOVERNANCE_BLOCKED;
    const completedSuccessfully = ex.state === WORKFLOW_EXECUTION_STATE.COMPLETED;

    const stepsDigest = ex.steps.map((s) => ({
      stepType: s.stepType,
      state: s.state,
      label: stepLabel(s.stepType),
    }));

    const approvalsDigest = ex.approvals.map((a) => ({
      approvalType: a.approvalType,
      state: a.approvalState,
      headline: approvalHeadline(a.approvalType, a.approvalState),
    }));

    let headlineCustomer =
      "Servelink recorded operational coordination signals for this visit.";
    let headlineFo =
      "Governed observe workflow has recorded pipeline signals for this booking.";
    let headlineAdmin = `Workflow ${ex.workflowType} — state ${ex.state}, mode ${ex.executionMode}.`;

    if (waitingOnApproval) {
      headlineCustomer =
        "Servelink is completing an internal coordination checkpoint before advancing governed operational recording.";
      headlineFo =
        "Workflow paused awaiting explicit approval — review admin approvals queue if you need status detail.";
      headlineAdmin =
        "Execution is waiting_approval — resume requires explicit approve on WorkflowApproval gate.";
    } else if (governanceBlocked) {
      headlineCustomer =
        "An internal safety check paused automated operational recording — your booking status on file is unchanged by this pause.";
      headlineFo =
        "Governance blocked a workflow step — dispatch and billing are not auto-adjusted from this signal.";
      headlineAdmin =
        "GOVERNANCE_BLOCKED on workflow — inspect failed step governanceOutcome + executionStage.";
    } else if (completedSuccessfully) {
      headlineCustomer =
        "Operational recording for this visit completed — summaries reflect committed signals, not projections.";
      headlineFo =
        "Observe workflow completed — audit/enrichment steps finished without autonomous booking edits.";
      headlineAdmin =
        "Workflow reached completed — verify approval rows + steps for audit completeness.";
    }

    return {
      hasWorkflow: true,
      workflowExecutionId: ex.id,
      workflowType: ex.workflowType,
      state: ex.state,
      executionStage: ex.executionStage,
      executionMode: ex.executionMode,
      approvalState: ex.approvalState,
      updatedAt: ex.updatedAt.toISOString(),
      waitingOnApproval,
      governanceBlocked,
      completedSuccessfully,
      headlineCustomer,
      headlineFo,
      headlineAdmin,
      stepsDigest,
      approvalsDigest,
    };
  }
}
