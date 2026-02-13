import { Module } from "@nestjs/common";
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
import { TelemetryController } from "./modules/telemetry/telemetry.controller";

const enableQueue = Boolean(process.env.REDIS_HOST || process.env.REDIS_URL);

@Module({
  imports: [
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
  ],
  controllers: [PricingController, MeController, TelemetryController],
})
export class AppModule {}
