import { Module } from "@nestjs/common";
import { ReliabilityModule } from "./common/reliability/reliability.module";
import { BullModule } from "@nestjs/bullmq";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";

import { PricingController } from "./controllers/pricing.controller";
import { MeController } from "./controllers/me.controller";

import { PrismaModule } from "./prisma.module";
import { AuthModule } from "./auth/auth.module";
import { SmsModule } from "./sms/sms.module";
import { BookingsModule } from "./modules/bookings/bookings.module";
import { BillingModule } from "./modules/billing/billing.module";
import { LedgerModule } from "./modules/ledger/ledger.module";
import { PayoutsModule } from "./modules/payouts/payouts.module";
import { DispatchModule } from "./modules/dispatch/dispatch.module";
import { FoModule } from "./modules/fo/fo.module";
import { AdminModule } from "./modules/admin/admin.module";
import { AdminBookingsModule } from "./modules/admin/bookings/admin-bookings.module";
import { AdminDispatchDecisionsModule } from "./modules/admin-dispatch-decisions/admin-dispatch-decisions.module";
import { TelemetryController } from "./modules/telemetry/telemetry.controller";
import { HealthController } from "./health.controller";
import { ReadinessController } from "./readiness.controller";
import { MetricsController } from "./metrics.controller";
import { DevModule } from "./dev/dev.module";
import { FinancialModule } from "./modules/financial/financial.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { SystemModule } from "./modules/system/system.module";
import { BookingDirectionIntakeModule } from "./modules/booking-direction-intake/booking-direction-intake.module";
import { PublicBookingOrchestratorModule } from "./modules/public-booking-orchestrator/public-booking-orchestrator.module";
import { AuthorityModule } from "./modules/authority/authority.module";
import { KnowledgeModule } from "./modules/knowledge/knowledge.module";
import { SystemTestsAutomationModule } from "./modules/system-tests-automation/system-tests-automation.module";
import { SystemTestsPipelineModule } from "./modules/system-tests-pipeline/system-tests-pipeline.module";
import { SystemTestsModule } from "./modules/system-tests/system-tests.module";
import { EncyclopediaModule } from "./modules/encyclopedia/encyclopedia.module";
import { RecurringModule } from "./modules/recurring/recurring.module";

const enableQueue = Boolean(process.env.REDIS_HOST || process.env.REDIS_URL);

const enableDevScenarioApi =
  process.env.NODE_ENV !== "production" &&
  process.env.DISABLE_DEV_SCENARIO_API !== "1";

@Module({
  imports: [
    ReliabilityModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ...(enableQueue
      ? [
          BullModule.forRoot({
            connection: process.env.REDIS_URL
              ? (process.env.REDIS_URL as any)
              : {
                  host: process.env.REDIS_HOST || "127.0.0.1",
                  port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
                },
          }),
        ]
      : []),
    PrismaModule,
    AuthModule,
    SmsModule,
    BookingsModule,
    BillingModule,
    LedgerModule,
    PayoutsModule,
    DispatchModule,
    FoModule,
    KnowledgeModule,
    AdminModule,
    AdminBookingsModule,
    AdminDispatchDecisionsModule,
    FinancialModule,
    PaymentsModule,
    SystemModule,
    BookingDirectionIntakeModule,
    PublicBookingOrchestratorModule,
    AuthorityModule,
    EncyclopediaModule,
    RecurringModule,
    SystemTestsModule,
    SystemTestsPipelineModule,
    SystemTestsAutomationModule,
    ...(enableDevScenarioApi ? [DevModule] : []),
  ],
  controllers: [
    PricingController,
    MeController,
    TelemetryController,
    HealthController,
    ReadinessController,
    MetricsController,
  ],
})
export class AppModule {}
