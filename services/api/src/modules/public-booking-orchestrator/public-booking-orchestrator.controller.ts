import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { PublicAvailabilityQueryDto } from "./dto/public-availability-query.dto";
import { PublicBookingFunnelMilestoneDto } from "./dto/public-booking-funnel-milestone.dto";
import { PublicDepositPrepareDto } from "./dto/public-deposit-prepare.dto";
import { PublicSlotConfirmDto } from "./dto/public-slot-confirm.dto";
import { PublicSlotSelectDto } from "./dto/public-slot-select.dto";
import { PublicBookingOrchestratorService } from "./public-booking-orchestrator.service";
import { PublicBookingFunnelMilestoneService } from "./public-booking-funnel-milestone.service";

const publicBookingPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

@Controller("/api/v1/public-booking")
export class PublicBookingOrchestratorController {
  constructor(
    private readonly orchestrator: PublicBookingOrchestratorService,
    private readonly funnelMilestones: PublicBookingFunnelMilestoneService,
  ) {}

  @Post("availability")
  @HttpCode(HttpStatus.OK)
  @UsePipes(publicBookingPipe)
  availability(@Body() body: PublicAvailabilityQueryDto) {
    return this.orchestrator.availability(body);
  }

  @Post("hold")
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(publicBookingPipe)
  hold(@Body() body: PublicSlotSelectDto) {
    return this.orchestrator.createHold(body);
  }

  @Post("deposit-prepare")
  @HttpCode(HttpStatus.OK)
  @UsePipes(publicBookingPipe)
  depositPrepare(@Body() body: PublicDepositPrepareDto) {
    return this.orchestrator.preparePublicDeposit(body);
  }

  @Post("funnel-milestone")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(publicBookingPipe)
  async funnelMilestone(@Body() body: PublicBookingFunnelMilestoneDto) {
    await this.funnelMilestones.record(body);
  }

  @Post("confirm")
  @HttpCode(HttpStatus.OK)
  @UsePipes(publicBookingPipe)
  confirm(
    @Body() body: PublicSlotConfirmDto,
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    const key =
      typeof idempotencyKey === "string" && idempotencyKey.trim().length > 0
        ? idempotencyKey.trim()
        : null;
    return this.orchestrator.confirmHold(body, key);
  }
}
