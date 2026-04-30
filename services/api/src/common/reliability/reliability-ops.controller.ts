import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import {
  SkipIdempotency,
  SkipRateLimit,
  SkipRetry,
  SkipTimeout,
} from "./reliability.decorators";
import { ReliabilityAdminGuard } from "./reliability-admin.guard";
import { OpsVisibilityService } from "./ops-visibility.service";
import { FoService } from "../../modules/fo/fo.service";
import { PaymentReliabilityService } from "../../modules/bookings/payment-reliability/payment-reliability.service";

/** Drilldown `items` rows include eligibility fields from `dto/system-ops-drilldown.dto.ts`. */
@Controller("api/v1/system/ops")
@UseGuards(JwtAuthGuard, ReliabilityAdminGuard)
export class ReliabilityOpsController {
  constructor(
    private readonly opsVisibility: OpsVisibilityService,
    private readonly foService: FoService,
    private readonly paymentReliability: PaymentReliabilityService,
  ) {}

  @SkipRateLimit()
  @SkipRetry()
  @SkipIdempotency()
  @SkipTimeout()
  @Get("summary")
  async getSummary() {
    const summary = await this.opsVisibility.getSummary();
    return {
      ok: true,
      ...summary,
      summary,
    };
  }

  @SkipRateLimit()
  @SkipRetry()
  @SkipIdempotency()
  @SkipTimeout()
  @Get("public-booking-lifecycle")
  async getPublicBookingLifecycleSummary() {
    return this.paymentReliability.getPublicBookingLifecycleSummary();
  }

  @SkipRateLimit()
  @SkipRetry()
  @SkipIdempotency()
  @SkipTimeout()
  @Get("estimate-learning")
  async getEstimateLearningSummary() {
    return this.paymentReliability.getEstimateLearningSummary();
  }

  @SkipRateLimit()
  @SkipRetry()
  @SkipIdempotency()
  @SkipTimeout()
  @Get("bookings/invalid-assignment-state")
  async getInvalidAssignmentStateBookings(
    @Query("limit") limit?: string,
  ) {
    return {
      ok: true,
      items: await this.opsVisibility.getInvalidAssignmentStateBookings(
        this.parseLimit(limit),
      ),
    };
  }

  @SkipRateLimit()
  @SkipRetry()
  @SkipIdempotency()
  @SkipTimeout()
  @Get("bookings/dispatch-locked")
  async getDispatchLockedBookings(@Query("limit") limit?: string) {
    return {
      ok: true,
      items: await this.opsVisibility.getDispatchLockedBookings(
        this.parseLimit(limit),
      ),
    };
  }

  @SkipRateLimit()
  @SkipRetry()
  @SkipIdempotency()
  @SkipTimeout()
  @Get("bookings/review-required")
  async getReviewRequiredBookings(@Query("limit") limit?: string) {
    return {
      ok: true,
      items: await this.opsVisibility.getReviewRequiredBookings(
        this.parseLimit(limit),
      ),
    };
  }

  @SkipRateLimit()
  @SkipRetry()
  @SkipIdempotency()
  @SkipTimeout()
  @Get("dispatch/deferred")
  async getDeferredDispatchDecisions(@Query("limit") limit?: string) {
    return {
      ok: true,
      items: await this.opsVisibility.getDeferredDispatchDecisions(
        this.parseLimit(limit),
      ),
    };
  }

  @SkipRateLimit()
  @SkipRetry()
  @SkipIdempotency()
  @SkipTimeout()
  @Get("dispatch/manual-actions")
  async getManualDispatchActionsLast24h(@Query("limit") limit?: string) {
    return {
      ok: true,
      items: await this.opsVisibility.getManualDispatchActionsLast24h(
        this.parseLimit(limit),
      ),
    };
  }

  @SkipRateLimit()
  @SkipRetry()
  @SkipIdempotency()
  @SkipTimeout()
  @Get("supply/franchise-owners")
  async listFoSupplyReadinessDiagnostics() {
    return {
      ok: true,
      items: await this.foService.listFoSupplyReadinessDiagnostics(),
    };
  }

  private parseLimit(limit?: string): number | undefined {
    if (!limit) {
      return undefined;
    }

    const parsed = Number(limit);
    if (!Number.isFinite(parsed)) {
      return undefined;
    }

    return parsed;
  }
}
