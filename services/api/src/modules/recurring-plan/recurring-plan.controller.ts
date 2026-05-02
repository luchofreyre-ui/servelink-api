import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ReliabilityAdminGuard } from '../../common/reliability/reliability-admin.guard';
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

  @UseGuards(JwtAuthGuard, ReliabilityAdminGuard)
  @Get('/admin')
  async listForAdmin(
    @Query('status') status?: 'active' | 'paused' | 'cancelled',
    @Query('cadence') cadence?: 'weekly' | 'biweekly' | 'monthly',
  ) {
    return this.service.listForAdmin({ status, cadence });
  }

  @UseGuards(JwtAuthGuard, ReliabilityAdminGuard)
  @Post('/admin/mark-not-converted')
  async markNotConverted(@Body() body: { bookingId: string }) {
    return this.service.markNotConverted(body.bookingId);
  }

  @UseGuards(JwtAuthGuard, ReliabilityAdminGuard)
  @Get('/admin/outcomes')
  async listOutcomes(@Query('converted') converted?: 'true' | 'false') {
    return this.service.listOutcomesForAdmin({
      converted: converted === undefined ? undefined : converted === 'true',
    });
  }
}
