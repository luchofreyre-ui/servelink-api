import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { PrismaService } from "../../prisma";
import { WorkflowExecutionCoordinatorService } from "./workflow-execution-coordinator.service";
import { WorkflowApprovalService } from "./workflow-approval.service";
import {
  APPROVAL_ESCALATION_CATEGORY,
  ESCALATION_STATE,
} from "./operational-policy.constants";
import {
  WORKFLOW_TIMER_STATE,
  WORKFLOW_WAIT_STATE,
} from "./workflow-timing.constants";
import {
  WORKFLOW_APPROVAL_RECORD_STATE,
} from "./workflow.constants";

type AuthedRequest = { user?: { userId: string; role: string } };

type DenyBody = {
  reason?: string;
};

type BookingTransitionRequestBody = {
  workflowExecutionId?: string;
  bookingId?: string;
  transition?: string;
  note?: string;
  idempotencyKey?: string | null;
};

type EscalationBody = {
  escalationCategory?: string;
  note?: string;
};

const ESCALATION_CATEGORIES = new Set<string>(
  Object.values(APPROVAL_ESCALATION_CATEGORY),
);

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller("/api/v1/admin/workflow-approvals")
export class AdminWorkflowApprovalsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly approvals: WorkflowApprovalService,
    private readonly coordinator: WorkflowExecutionCoordinatorService,
  ) {}

  @Get()
  async listForBooking(@Query("bookingId") bookingId: string | undefined) {
    const id = bookingId?.trim();
    if (!id) {
      throw new BadRequestException("bookingId is required");
    }

    const items = await this.prisma.workflowApproval.findMany({
      where: {
        execution: { aggregateType: "booking", aggregateId: id },
      },
      orderBy: { requestedAt: "desc" },
      take: 100,
      include: {
        execution: {
          select: {
            id: true,
            workflowType: true,
            state: true,
            executionStage: true,
            approvalState: true,
          },
        },
        audits: { orderBy: { createdAt: "desc" }, take: 40 },
        escalations: { orderBy: { triggeredAt: "desc" }, take: 20 },
      },
    });

    return { ok: true, items };
  }

  /** Portfolio-wide approval/timer posture — deterministic aggregates only (Phase 18). */
  @Get("queue-summary")
  async approvalQueueSummary() {
    const now = new Date();
    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const since48h = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const plus24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const [
      pendingApprovals,
      oldestPending,
      pendingAged48hPlus,
      openEscalations,
      openEscalationsAged24hPlus,
      pendingExpiringWithin24h,
      activeWorkflowWaits,
      overdueWorkflowTimers,
    ] = await Promise.all([
      this.prisma.workflowApproval.count({
        where: { approvalState: WORKFLOW_APPROVAL_RECORD_STATE.PENDING },
      }),
      this.prisma.workflowApproval.findFirst({
        where: { approvalState: WORKFLOW_APPROVAL_RECORD_STATE.PENDING },
        orderBy: { requestedAt: "asc" },
        select: {
          id: true,
          approvalType: true,
          workflowExecutionId: true,
          requestedAt: true,
          expiresAt: true,
        },
      }),
      this.prisma.workflowApproval.count({
        where: {
          approvalState: WORKFLOW_APPROVAL_RECORD_STATE.PENDING,
          requestedAt: { lt: since48h },
        },
      }),
      this.prisma.workflowApprovalEscalation.count({
        where: { escalationState: ESCALATION_STATE.OPEN },
      }),
      this.prisma.workflowApprovalEscalation.count({
        where: {
          escalationState: ESCALATION_STATE.OPEN,
          triggeredAt: { lt: since24h },
        },
      }),
      this.prisma.workflowApproval.count({
        where: {
          approvalState: WORKFLOW_APPROVAL_RECORD_STATE.PENDING,
          expiresAt: { not: null, gte: now, lte: plus24h },
        },
      }),
      this.prisma.workflowWaitState.count({
        where: { waitState: WORKFLOW_WAIT_STATE.ACTIVE },
      }),
      this.prisma.workflowTimer.count({
        where: {
          timerState: WORKFLOW_TIMER_STATE.PENDING,
          wakeAt: { lte: now },
        },
      }),
    ]);

    return {
      ok: true,
      summary: {
        pendingApprovals,
        oldestPendingApproval: oldestPending
          ? {
              id: oldestPending.id,
              approvalType: oldestPending.approvalType,
              workflowExecutionId: oldestPending.workflowExecutionId,
              requestedAt: oldestPending.requestedAt.toISOString(),
              expiresAt: oldestPending.expiresAt?.toISOString() ?? null,
            }
          : null,
        pendingApprovalsAged48hPlus: pendingAged48hPlus,
        openEscalations,
        openEscalationsAged24hPlus,
        pendingApprovalsWithExpiryWithin24h: pendingExpiringWithin24h,
        activeWorkflowWaits,
        overdueWorkflowTimers,
      },
    };
  }

  @Post("booking-transition-requests")
  async requestBookingTransitionInvoke(
    @Req() req: AuthedRequest,
    @Body() body: BookingTransitionRequestBody,
  ) {
    const actor = req.user?.userId?.trim();
    if (!actor) {
      throw new UnauthorizedException();
    }

    const workflowExecutionId = body.workflowExecutionId?.trim();
    const bookingId = body.bookingId?.trim();
    const transition = body.transition?.trim();

    if (!workflowExecutionId || !bookingId || !transition) {
      throw new BadRequestException(
        "workflowExecutionId, bookingId, and transition are required",
      );
    }

    const created = await this.approvals.requestBookingTransitionInvokeApproval({
      workflowExecutionId,
      bookingId,
      transition,
      note: body.note?.trim(),
      idempotencyKey: body.idempotencyKey ?? null,
      requestedByUserId: actor,
    });

    return { ok: true, workflowApprovalId: created.workflowApprovalId };
  }

  /** Records an operational escalation signal — does not approve, deny, or invoke transitions. */
  @Post(":id/escalations")
  async recordEscalation(
    @Req() req: AuthedRequest,
    @Param("id") id: string,
    @Body() body: EscalationBody,
  ) {
    const actor = req.user?.userId?.trim();
    if (!actor) {
      throw new UnauthorizedException();
    }

    const trimmed = id?.trim();
    if (!trimmed) {
      throw new BadRequestException("id is required");
    }

    const approval = await this.prisma.workflowApproval.findUnique({
      where: { id: trimmed },
      select: { id: true },
    });
    if (!approval) {
      throw new NotFoundException("WORKFLOW_APPROVAL_NOT_FOUND");
    }

    const rawCategory =
      body.escalationCategory?.trim() ||
      APPROVAL_ESCALATION_CATEGORY.OPERATOR_REVIEW;
    if (!ESCALATION_CATEGORIES.has(rawCategory)) {
      throw new BadRequestException("invalid escalationCategory");
    }

    await this.prisma.workflowApprovalEscalation.create({
      data: {
        workflowApprovalId: trimmed,
        escalationCategory: rawCategory,
        escalationState: ESCALATION_STATE.OPEN,
        triggeredByUserId: actor,
        ...(body.note?.trim()
          ? { payloadJson: { note: body.note.trim() } }
          : {}),
      },
    });

    return { ok: true };
  }

  @Post(":id/approve")
  async approve(@Req() req: AuthedRequest, @Param("id") id: string) {
    const actor = req.user?.userId?.trim();
    if (!actor) {
      throw new UnauthorizedException();
    }

    const trimmed = id?.trim();
    if (!trimmed) {
      throw new BadRequestException("id is required");
    }

    const outcome = await this.approvals.approve({
      workflowApprovalId: trimmed,
      actorUserId: actor,
    });

    if (outcome.resumeWorkflowExecution) {
      await this.coordinator.executeWorkflowUntilComplete(
        outcome.workflowExecutionId,
      );
    }

    return { ok: true, ...outcome };
  }

  @Post(":id/deny")
  async deny(
    @Req() req: AuthedRequest,
    @Param("id") id: string,
    @Body() body: DenyBody,
  ) {
    const actor = req.user?.userId?.trim();
    if (!actor) {
      throw new UnauthorizedException();
    }

    const trimmed = id?.trim();
    if (!trimmed) {
      throw new BadRequestException("id is required");
    }

    await this.approvals.deny({
      workflowApprovalId: trimmed,
      actorUserId: actor,
      reason: body.reason?.trim(),
    });

    return { ok: true };
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    const trimmed = id?.trim();
    if (!trimmed) {
      throw new BadRequestException("id is required");
    }

    const row = await this.prisma.workflowApproval.findUnique({
      where: { id: trimmed },
      include: {
        execution: true,
        audits: { orderBy: { createdAt: "asc" } },
        escalations: { orderBy: { triggeredAt: "desc" }, take: 40 },
      },
    });

    if (!row) {
      throw new NotFoundException("WORKFLOW_APPROVAL_NOT_FOUND");
    }

    return { ok: true, item: row };
  }
}
