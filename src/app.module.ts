import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PricingController } from './controllers/pricing.controller';
import { MeController } from './controllers/me.controller';

import { AuthModule } from './auth/auth.module';
import { SmsModule } from './sms/sms.module';
import { BookingsModule } from './modules/bookings/bookings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    SmsModule,
    BookingsModule,
  ],
  controllers: [PricingController, MeController],
})
export class AppModule {}
