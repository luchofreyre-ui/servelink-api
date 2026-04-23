import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
import { ScheduleTeamOptionsQueryDto } from "../bookings/dto/schedule-team-options-query.dto";

const scheduleTeamOptionsQueryPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: false,
});

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

  /** Validation: root reachability (admin + customer JWT). */
  @Roles(Role.admin, Role.customer)
  @UseGuards(JwtAuthGuard)
  @Get()
  root() {
    return {
      ok: true,
      message: "Recurring root reachable",
      timestamp: new Date().toISOString(),
    };
  }

  /** Validation: debug reachability (admin + customer JWT). */
  @Roles(Role.admin, Role.customer)
  @UseGuards(JwtAuthGuard)
  @Get("debug/routes")
  getRecurringRoutes(@Req() req: any) {
    return {
      ok: true,
      message: "Recurring routes reachable",
      user: req.user ?? null,
      timestamp: new Date().toISOString(),
    };
  }

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

  @Get("plans/:planId/schedule-team-options")
  @UsePipes(scheduleTeamOptionsQueryPipe)
  async getScheduleTeamOptions(
    @Param("planId") planId: string,
    @Query() query: ScheduleTeamOptionsQueryDto,
    @Req() req: { user: { userId: string; role: Role } },
  ) {
    return this.recurring.getScheduleTeamOptionsForPlan(
      planId,
      String(req.user.userId),
      query,
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
