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

@Controller("api/v1/system/ops/exception-actions")
@UseGuards(JwtAuthGuard, ReliabilityAdminGuard)
export class DispatchOpsExceptionController {
  constructor(private readonly service: DispatchOpsService) {}

  @SkipRateLimit()
  @SkipRetry()
  @SkipIdempotency()
  @SkipTimeout()
  @Post(":dispatchExceptionKey/assign-to-me")
  assignToMe(
    @Param("dispatchExceptionKey") dispatchExceptionKey: string,
    @Req() req: { user?: unknown },
  ) {
    return this.service.assignExceptionToMe(dispatchExceptionKey, req.user);
  }

  @SkipRateLimit()
  @SkipRetry()
  @SkipIdempotency()
  @SkipTimeout()
  @Post(":dispatchExceptionKey/resolve")
  resolve(
    @Param("dispatchExceptionKey") dispatchExceptionKey: string,
    @Req() req: { user?: unknown },
  ) {
    return this.service.resolveException(dispatchExceptionKey, req.user);
  }
}
