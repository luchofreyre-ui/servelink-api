import { Global, Module } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { AuthModule } from "../../auth/auth.module";
import { BillingModule } from "../../modules/billing/billing.module";
import { FoModule } from "../../modules/fo/fo.module";
import { SlotHoldsModule } from "../../modules/slot-holds/slot-holds.module";
import { OpsVisibilityService } from "./ops-visibility.service";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";
import { IdempotencyInterceptor } from "./idempotency.interceptor";
import { RateLimitGuard } from "./rate-limit.guard";
import { ReliabilityAdminController } from "./reliability.admin.controller";
import { ReliabilityAdminGuard } from "./reliability-admin.guard";
import { ReliabilityHeadersInterceptor } from "./reliability-headers.interceptor";
import { ReliabilityMetricsService } from "./reliability-metrics.service";
import { ReliabilityOpsController } from "./reliability-ops.controller";
import { RequestContextInterceptor } from "./request-context.interceptor";
import { RequestContextService } from "./request-context.service";
import { RetryInterceptor } from "./retry.interceptor";
import { TimeoutInterceptor } from "./timeout.interceptor";

@Global()
@Module({
  imports: [AuthModule, BillingModule, FoModule, SlotHoldsModule],
  controllers: [
    HealthController,
    ReliabilityAdminController,
    ReliabilityOpsController,
  ],
  providers: [
    OpsVisibilityService,
    HealthService,
    ReliabilityMetricsService,
    RequestContextService,
    ReliabilityAdminGuard,
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestContextInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ReliabilityHeadersInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TimeoutInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RetryInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: IdempotencyInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
  exports: [
    OpsVisibilityService,
    HealthService,
    ReliabilityMetricsService,
    RequestContextService,
    ReliabilityAdminGuard,
  ],
})
export class ReliabilityModule {}
