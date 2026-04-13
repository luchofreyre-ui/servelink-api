import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import {
  SkipIdempotency,
  SkipRateLimit,
  SkipRetry,
  SkipTimeout,
} from "../../common/reliability/reliability.decorators";
import { ReliabilityAdminGuard } from "../../common/reliability/reliability-admin.guard";
import { RecurringService } from "./recurring.service";

@Controller("/api/v1/recurring/ops")
@UseGuards(JwtAuthGuard, ReliabilityAdminGuard)
export class RecurringOpsController {
  constructor(private readonly recurring: RecurringService) {}

  @SkipRateLimit()
  @SkipRetry()
  @SkipIdempotency()
  @SkipTimeout()
  @Get("summary")
  async getSummary() {
    const item = await this.recurring.getRecurringOpsSummary();
    return { ok: true as const, item };
  }

  @SkipRateLimit()
  @SkipRetry()
  @SkipIdempotency()
  @SkipTimeout()
  @Get("exhausted")
  async getExhausted(@Query("limit") limit?: string) {
    const parsed = limit != null ? Number(limit) : 50;
    const safe = Number.isFinite(parsed) ? parsed : 50;
    const items = await this.recurring.getExhaustedRecurringOccurrences(safe);
    return { ok: true as const, items };
  }
}
