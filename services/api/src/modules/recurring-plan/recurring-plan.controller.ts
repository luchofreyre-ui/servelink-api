import { Controller, Post, Body } from '@nestjs/common';
import { RecurringPlanService } from './recurring-plan.service';

@Controller('/api/v1/recurring-plans')
export class RecurringPlanController {
  constructor(private service: RecurringPlanService) {}

  @Post('/create-from-booking')
  async createFromBooking(
    @Body()
    body: {
      bookingId: string;
      cadence: 'weekly' | 'biweekly' | 'monthly';
    },
  ) {
    return this.service.createFromBooking(body);
  }
}
