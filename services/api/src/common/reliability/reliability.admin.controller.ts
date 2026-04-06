import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import {
  SkipIdempotency,
  SkipRateLimit,
  SkipRetry,
} from "./reliability.decorators";
import { ReliabilityAdminGuard } from "./reliability-admin.guard";
import { ReliabilityMetricsService } from "./reliability-metrics.service";

@Controller("api/v1/system/reliability")
@UseGuards(JwtAuthGuard, ReliabilityAdminGuard)
export class ReliabilityAdminController {
  constructor(
    private readonly metrics: ReliabilityMetricsService,
  ) {}

  @SkipRateLimit()
  @SkipRetry()
  @SkipIdempotency()
  @Get()
  getReliabilitySnapshot() {
    return {
      ok: true,
      metrics: this.metrics.snapshot(),
    };
  }
}
