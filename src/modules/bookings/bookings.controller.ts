import { Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { TransitionBookingDto } from './dto/transition-booking.dto';

@UseGuards(JwtAuthGuard)
@Controller('/api/v1/bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Post()
  async create(
    @Req() req: any,
    @Body() dto: CreateBookingDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    // CustomerId comes from JWT (req.user.userId), NOT from request body
    return this.bookings.createBooking({
      customerId: String(req.user.userId),
      note: dto.note,
      idempotencyKey: idempotencyKey ?? null,
    });
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.bookings.getBooking(id);
  }

  @Get(':id/events')
  async events(@Param('id') id: string) {
    return this.bookings.getEvents(id);
  }

  @Post(':id/schedule')
  async schedule(
    @Param('id') id: string,
    @Body() dto: TransitionBookingDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.bookings.transitionBooking({
      id,
      transition: 'schedule',
      note: dto.note,
      idempotencyKey: idempotencyKey ?? null,
    });
  }

  @Post(':id/start')
  async start(
    @Param('id') id: string,
    @Body() dto: TransitionBookingDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.bookings.transitionBooking({
      id,
      transition: 'start',
      note: dto.note,
      idempotencyKey: idempotencyKey ?? null,
    });
  }

  @Post(':id/complete')
  async complete(
    @Param('id') id: string,
    @Body() dto: TransitionBookingDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.bookings.transitionBooking({
      id,
      transition: 'complete',
      note: dto.note,
      idempotencyKey: idempotencyKey ?? null,
    });
  }

  @Post(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @Body() dto: TransitionBookingDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.bookings.transitionBooking({
      id,
      transition: 'cancel',
      note: dto.note,
      idempotencyKey: idempotencyKey ?? null,
    });
  }
}
