import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { WorkflowOrchestrationSimulationService } from "./workflow-orchestration-simulation.service";

type AuthedRequest = { user?: { userId: string; role: string } };

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller("/api/v1/admin/orchestration-simulation")
export class AdminOrchestrationSimulationController {
  constructor(private readonly simulation: WorkflowOrchestrationSimulationService) {}

  @Post("run")
  async run(
    @Req() req: AuthedRequest,
    @Body()
    body: {
      workflowExecutionId?: string;
      scenarioCategory?: string;
      activationId?: string | null;
      idempotencyKey?: string | null;
    },
  ) {
    const actor = req.user?.userId?.trim();
    if (!actor) {
      throw new UnauthorizedException();
    }
    const wfId = body.workflowExecutionId?.trim();
    const category = body.scenarioCategory?.trim();
    if (!wfId || !category) {
      throw new BadRequestException(
        "workflowExecutionId and scenarioCategory are required",
      );
    }
    const result = await this.simulation.runScenario({
      workflowExecutionId: wfId,
      scenarioCategory: category,
      activationId: body.activationId?.trim() || null,
      requestedByUserId: actor,
      idempotencyKey: body.idempotencyKey?.trim() || null,
    });
    return { ok: true, ...result };
  }

  @Get("scenarios")
  async scenarios(
    @Query("workflowExecutionId") workflowExecutionId: string | undefined,
    @Query("take") takeRaw?: string,
  ) {
    const wfId = workflowExecutionId?.trim();
    if (!wfId) {
      throw new BadRequestException("workflowExecutionId is required");
    }
    const parsed = takeRaw != null ? Number(takeRaw) : 30;
    const take =
      Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 80) : 30;
    const items = await this.simulation.listScenarios(wfId, take);
    return { ok: true, items };
  }

  @Get("safety-evaluations")
  async safetyEvaluations(
    @Query("workflowExecutionId") workflowExecutionId: string | undefined,
    @Query("take") takeRaw?: string,
  ) {
    const wfId = workflowExecutionId?.trim();
    if (!wfId) {
      throw new BadRequestException("workflowExecutionId is required");
    }
    const parsed = takeRaw != null ? Number(takeRaw) : 50;
    const take =
      Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 120) : 50;
    const items = await this.simulation.listSafetyEvaluations(wfId, take);
    return { ok: true, items };
  }
}
