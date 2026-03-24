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

@Controller("/api/v1/booking-direction-intake")
export class BookingDirectionIntakeSubmitController {
  constructor(private readonly bridge: IntakeBookingBridgeService) {}

  @Post("submit")
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  submit(@Body() body: CreateBookingDirectionIntakeDto) {
    return this.bridge.submitIntakeAndCreateBooking(body);
  }
}
