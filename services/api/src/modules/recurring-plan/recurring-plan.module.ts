import { Module } from '@nestjs/common';
import { RecurringPlanService } from './recurring-plan.service';
import { RecurringPlanController } from './recurring-plan.controller';

@Module({
  providers: [RecurringPlanService],
  controllers: [RecurringPlanController],
})
export class RecurringPlanModule {}
