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
import { CreateBookingDirectionIntakeDto } from "./dto/create-booking-direction-intake.dto";
import { IntakeBookingBridgeService } from "./intake-booking-bridge.service";
import { TenantResolver } from "../tenant/tenant.resolver";

const intakeBodyPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

@Controller("/api/v1/booking-direction-intake")
export class BookingDirectionIntakeSubmitController {
  constructor(
    private readonly bridge: IntakeBookingBridgeService,
    private readonly tenantResolver: TenantResolver,
  ) {}

  /**
   * Pre-submit estimate for the public booking flow — no persistence.
   */
  @Post("preview-estimate")
  @HttpCode(HttpStatus.OK)
  @UsePipes(intakeBodyPipe)
  previewEstimate(@Body() body: CreateBookingDirectionIntakeDto) {
    return this.bridge.previewEstimateFromDto(body);
  }

  @Post("submit")
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(intakeBodyPipe)
  submit(
    @Body() body: CreateBookingDirectionIntakeDto,
    @Headers("host") host?: string,
  ) {
    const tenantId = this.tenantResolver.resolve({ host }).tenantId;
    return this.bridge.submitIntakeAndCreateBooking(body, tenantId);
  }
}
