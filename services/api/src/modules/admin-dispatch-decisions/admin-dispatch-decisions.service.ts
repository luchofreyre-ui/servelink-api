import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma";
import { CreateAdminDispatchDecisionDto } from "./dto/create-admin-dispatch-decision.dto";
import type { AdminDispatchDecisionResult } from "./admin-dispatch-decisions.types";
import { AdminDispatchDecisionsExecutionService } from "./admin-dispatch-decisions.execution.service";

@Injectable()
export class AdminDispatchDecisionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly executionService: AdminDispatchDecisionsExecutionService,
  ) {}

  private actionRequiresTargetFo(action: string): boolean {
    return action === "approve_assignment" || action === "reassign";
  }

  async createDecision(
    dto: CreateAdminDispatchDecisionDto,
    submittedByUserId: string,
  ): Promise<AdminDispatchDecisionResult> {
    if (this.actionRequiresTargetFo(dto.action) && !dto.targetFoId) {
      throw new BadRequestException(
        "A target FO is required for approve_assignment and reassign.",
      );
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      select: { id: true },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found.");
    }

    const decision = await this.prisma.adminDispatchDecision.create({
      data: {
        bookingId: dto.bookingId,
        action: dto.action,
        rationale: dto.rationale.trim(),
        targetFoId: dto.targetFoId?.trim() || null,
        submittedByUserId,
        submittedByRole: dto.submittedByRole,
        source: dto.source,
        submittedAt: new Date(dto.submittedAt),
        status: "accepted",
        executionStatus: "pending",
        executionIdempotencyKey: [
          dto.bookingId,
          dto.action,
          dto.targetFoId?.trim() || "none",
          submittedByUserId,
          dto.submittedAt,
        ].join(":"),
      },
      select: {
        id: true,
      },
    });

    return this.executionService.executeDecision(decision.id);
  }

  async executeExistingDecision(decisionId: string): Promise<AdminDispatchDecisionResult> {
    return this.executionService.executeDecision(decisionId);
  }
}
