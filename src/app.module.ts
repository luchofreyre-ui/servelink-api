import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { PricingController } from "./controllers/pricing.controller";
import { MeController } from "./controllers/me.controller";
import { StripeWebhookController } from "./controllers/stripe-webhook.controller";

import { PrismaModule } from "./prisma.module";
import { AuthModule } from "./auth/auth.module";
import { SmsModule } from "./sms/sms.module";
import { BookingsModule } from "./modules/bookings/bookings.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    SmsModule,
    BookingsModule,
  ],
  controllers: [PricingController, MeController, StripeWebhookController],
})
export class AppModule {}
