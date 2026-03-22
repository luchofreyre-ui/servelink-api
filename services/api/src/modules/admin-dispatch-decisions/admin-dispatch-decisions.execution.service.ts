import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma";
import { AdminDispatchDecisionsExecutionAdapter } from "./admin-dispatch-decisions.execution.adapter";
import type { AdminDispatchDecisionResult } from "./admin-dispatch-decisions.types";

@Injectable()
export class AdminDispatchDecisionsExecutionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly executionAdapter: AdminDispatchDecisionsExecutionAdapter,
  ) {}

  async executeDecision(decisionId: string): Promise<AdminDispatchDecisionResult> {
    const decision = await this.prisma.adminDispatchDecision.findUnique({
      where: { id: decisionId },
      select: {
        id: true,
        bookingId: true,
        action: true,
        rationale: true,
        targetFoId: true,
        submittedByUserId: true,
        executionStatus: true,
        executionAttemptCount: true,
      },
    });

    if (!decision) {
      throw new NotFoundException("Admin dispatch decision not found.");
    }

    if (decision.executionStatus === "applied") {
      return {
        ok: true,
        decisionId: decision.id,
        status: "accepted",
        message: "Dispatch decision was already executed successfully.",
      };
    }

    if (decision.executionStatus === "executing") {
      return {
        ok: false,
        decisionId: decision.id,
        status: "rejected",
        message: "Dispatch decision is already executing.",
      };
    }

    await this.prisma.adminDispatchDecision.update({
      where: { id: decision.id },
      data: {
        executionStatus: "executing",
        executionStartedAt: new Date(),
        executionAttemptCount: {
          increment: 1,
        },
      },
    });

    try {
      const execution = await this.executionAdapter.applyDecision({
        id: decision.id,
        bookingId: decision.bookingId,
        action: decision.action,
        rationale: decision.rationale,
        targetFoId: decision.targetFoId,
        submittedByUserId: decision.submittedByUserId,
      });

      if (execution.outcome === "rejected") {
        await this.prisma.adminDispatchDecision.update({
          where: { id: decision.id },
          data: {
            executionStatus: "rejected",
            executionMessage: execution.message,
            executionErrorCode: execution.errorCode ?? null,
            executedAt: new Date(),
          },
        });

        return {
          ok: false,
          decisionId: decision.id,
          status: "rejected",
          message: execution.message,
        };
      }

      await this.prisma.adminDispatchDecision.update({
        where: { id: decision.id },
        data: {
          executionStatus: "applied",
          executionMessage: execution.message,
          executionErrorCode: null,
          executedAt: new Date(),
        },
      });

      return {
        ok: true,
        decisionId: decision.id,
        status: "accepted",
        message: execution.message,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Dispatch decision execution failed unexpectedly.";

      await this.prisma.adminDispatchDecision.update({
        where: { id: decision.id },
        data: {
          executionStatus: "failed",
          executionMessage: message,
          executionErrorCode: "EXECUTION_FAILED",
        },
      });

      throw error;
    }
  }
}
