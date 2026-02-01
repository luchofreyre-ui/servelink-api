import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { BookingEventsService } from './booking-events.service';

@Module({
  controllers: [BookingsController],
  providers: [BookingsService, BookingEventsService],
  exports: [BookingsService],
})
export class BookingsModule {}
