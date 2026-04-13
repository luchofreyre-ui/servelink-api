import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { CreateBookingDirectionIntakeDto } from "./dto/create-booking-direction-intake.dto";
import { IntakeBookingBridgeService } from "./intake-booking-bridge.service";

const intakeBodyPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

@Controller("/api/v1/booking-direction-intake")
export class BookingDirectionIntakeSubmitController {
  constructor(private readonly bridge: IntakeBookingBridgeService) {}

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
  submit(@Body() body: CreateBookingDirectionIntakeDto) {
    return this.bridge.submitIntakeAndCreateBooking(body);
  }
}
