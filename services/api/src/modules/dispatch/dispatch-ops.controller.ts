import { Controller, Param, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import {
  SkipIdempotency,
  SkipRateLimit,
  SkipRetry,
  SkipTimeout,
} from "../../common/reliability/reliability.decorators";
import { ReliabilityAdminGuard } from "../../common/reliability/reliability-admin.guard";
import { DispatchOpsService } from "./dispatch-ops.service";

/**
 * Booking-scoped ops POSTs. GET drilldown lists under `/api/v1/system/ops/*` append
 * `SystemOpsDrilldownEligibilityFields` via `OpsVisibilityService` +
 * `buildSystemOpsDrilldownEligibility` (see `dto/system-ops-drilldown.dto.ts`).
 */
@Controller("api/v1/system/ops/bookings")
@UseGuards(JwtAuthGuard, ReliabilityAdminGuard)
export class DispatchOpsController {
  constructor(private readonly service: DispatchOpsService) {}

  @SkipRateLimit()
  @SkipRetry()
  @SkipIdempotency()
  @SkipTimeout()
  @Post(":bookingId/release-dispatch-lock")
  releaseDispatchLock(@Param("bookingId") bookingId: string, @Req() req: any) {
    return this.service.releaseDispatchLock(bookingId, req.user);
  }

  @SkipRateLimit()
  @SkipRetry()
  @SkipIdempotency()
  @SkipTimeout()
  @Post(":bookingId/clear-review-required")
  clearReviewRequired(@Param("bookingId") bookingId: string, @Req() req: any) {
    return this.service.clearReviewRequired(bookingId, req.user);
  }

  @SkipRateLimit()
  @SkipRetry()
  @SkipIdempotency()
  @SkipTimeout()
  @Post(":bookingId/trigger-redispatch")
  triggerRedispatch(@Param("bookingId") bookingId: string, @Req() req: any) {
    return this.service.triggerRedispatch(bookingId, req.user);
  }
}
