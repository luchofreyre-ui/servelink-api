import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { Role } from "@prisma/client";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { Roles } from "../../auth/roles.decorator";
import { RolesGuard } from "../../auth/roles.guard";
import { CreateRecurringPlanDto } from "./dto/create-recurring-plan.dto";
import { UpdateNextOccurrenceDto } from "./dto/update-next-occurrence.dto";
import { UpdateRecurringPlanDto } from "./dto/update-recurring-plan.dto";
import { RecurringService } from "./recurring.service";

const recurringBodyPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

const patchNextOccurrencePipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

const patchRecurringPlanPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

@Controller("/api/v1/recurring")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.customer)
export class RecurringController {
  constructor(private readonly recurring: RecurringService) {}

  @Post("plans")
  @UsePipes(recurringBodyPipe)
  async createPlan(
    @Req() req: { user: { userId: string; role: Role } },
    @Body() body: CreateRecurringPlanDto,
  ) {
    return this.recurring.createRecurringPlan(String(req.user.userId), body);
  }

  @Get("plans/me")
  async listMyPlans(@Req() req: { user: { userId: string; role: Role } }) {
    const items = await this.recurring.listPlansForCustomer(
      String(req.user.userId),
    );
    return { ok: true, items };
  }

  @Post("plans/:planId/next-occurrence/skip")
  async skipNextOccurrence(
    @Param("planId") planId: string,
    @Req() req: { user: { userId: string; role: Role } },
  ) {
    return this.recurring.skipNextOccurrenceForCustomer(
      planId,
      String(req.user.userId),
    );
  }

  @Get("plans/:planId/next-occurrence")
  async getNextOccurrence(
    @Param("planId") planId: string,
    @Req() req: { user: { userId: string; role: Role } },
  ) {
    return this.recurring.getNextOccurrenceForCustomer(
      planId,
      String(req.user.userId),
    );
  }

  @Patch("plans/:planId/next-occurrence")
  @UsePipes(patchNextOccurrencePipe)
  async patchNextOccurrence(
    @Param("planId") planId: string,
    @Req() req: { user: { userId: string; role: Role } },
    @Body() body: UpdateNextOccurrenceDto,
  ) {
    return this.recurring.patchNextOccurrenceForCustomer(
      planId,
      String(req.user.userId),
      body,
    );
  }

  @Get("plans/:planId")
  async getPlan(
    @Param("planId") planId: string,
    @Req() req: { user: { userId: string; role: Role } },
  ) {
    return this.recurring.getRecurringPlanForCustomer(
      planId,
      String(req.user.userId),
    );
  }

  @Patch("plans/:planId")
  @UsePipes(patchRecurringPlanPipe)
  async patchPlan(
    @Param("planId") planId: string,
    @Req() req: { user: { userId: string; role: Role } },
    @Body() body: UpdateRecurringPlanDto,
  ) {
    return this.recurring.updateRecurringPlanForCustomer(
      planId,
      String(req.user.userId),
      body,
    );
  }
}
