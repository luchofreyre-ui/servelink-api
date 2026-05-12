import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { PrismaService } from "../../prisma";
import { OperationalPolicyEvaluationService } from "./operational-policy-evaluation.service";
import { WorkflowTimerWakeService } from "./workflow-timer-wake.service";

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller("/api/v1/admin/workflow-executions")
export class AdminWorkflowExecutionsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operationalPolicy: OperationalPolicyEvaluationService,
    private readonly timerWake: WorkflowTimerWakeService,
  ) {}

  /** Read-only list by booking aggregate — no replay or mutation controls. */
  @Get()
  async listForBooking(@Query("bookingId") bookingId: string | undefined) {
    const id = bookingId?.trim();
    if (!id) {
      throw new BadRequestException("bookingId is required");
    }
    const items = await this.prisma.workflowExecution.findMany({
      where: { aggregateType: "booking", aggregateId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        steps: {
          orderBy: { createdAt: "asc" },
        },
        approvals: {
          orderBy: { requestedAt: "desc" },
          take: 25,
          include: {
            audits: { orderBy: { createdAt: "desc" }, take: 30 },
          },
        },
      },
    });
    return { ok: true, items };
  }

  /** Deterministic policy snapshot refresh — observability only; does not advance workflows. */
  @Post("execution/:id/evaluate-policies")
  async evaluatePolicies(@Param("id") id: string) {
    const trimmed = id?.trim();
    if (!trimmed) {
      throw new BadRequestException("id is required");
    }
    const row = await this.prisma.workflowExecution.findUnique({
      where: { id: trimmed },
      select: { id: true },
    });
    if (!row) {
      throw new NotFoundException("WORKFLOW_EXECUTION_NOT_FOUND");
    }
    await this.operationalPolicy.persistSnapshot(trimmed);
    const evaluations =
      await this.operationalPolicy.listForExecution(trimmed);
    return { ok: true, evaluations };
  }

  /** Explicit timer wake batch — governance visibility only (no replay controls). */
  @Post("timers/process-once")
  async processTimersOnce(@Body() body: { limit?: number }) {
    const raw = body?.limit;
    const parsed = raw != null ? Number(raw) : 25;
    const limit = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 200) : 25;
    const result = await this.timerWake.processDueTimers({ limit });
    return { ok: true, ...result };
  }

  @Get("execution/:id")
  async getExecution(@Param("id") id: string) {
    const trimmed = id?.trim();
    if (!trimmed) {
      throw new BadRequestException("id is required");
    }
    const row = await this.prisma.workflowExecution.findUnique({
      where: { id: trimmed },
      include: {
        steps: { orderBy: { createdAt: "asc" } },
        approvals: {
          orderBy: { requestedAt: "desc" },
          take: 25,
          include: {
            audits: { orderBy: { createdAt: "desc" }, take: 30 },
          },
        },
        timers: { orderBy: { wakeAt: "asc" }, take: 40 },
        waitStates: { orderBy: { createdAt: "desc" }, take: 40 },
      },
    });
    if (!row) {
      throw new NotFoundException("WORKFLOW_EXECUTION_NOT_FOUND");
    }
    return { ok: true, item: row };
  }
}
