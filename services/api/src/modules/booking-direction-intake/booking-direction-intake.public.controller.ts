import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { BookingDirectionIntakeService } from "./booking-direction-intake.service";
import { CreateBookingDirectionIntakeDto } from "./dto/create-booking-direction-intake.dto";

@Controller("/api/v1/booking-direction/intakes")
export class BookingDirectionIntakePublicController {
  constructor(private readonly intakes: BookingDirectionIntakeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  create(@Body() body: CreateBookingDirectionIntakeDto) {
    return this.intakes.create(body);
  }
}
