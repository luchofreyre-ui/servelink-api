import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { OperationalPortfolioOrchestrationService } from "./operational-portfolio-orchestration.service";

/** Portfolio-level orchestration visibility — counts only; no autonomous prioritization. */
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller("/api/v1/admin/portfolio-orchestration")
export class AdminPortfolioOrchestrationController {
  constructor(
    private readonly portfolio: OperationalPortfolioOrchestrationService,
  ) {}

  @Get("summary")
  async summary() {
    const summary =
      await this.portfolio.getAdminPortfolioOrchestrationSummary();
    return { ok: true, summary };
  }
}
