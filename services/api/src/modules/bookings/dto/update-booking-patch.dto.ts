import { BookingStatus } from "@prisma/client";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";

/** PATCH /api/v1/bookings/:id — partial update of safe operational fields */
export class UpdateBookingPatchDto {
  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsString()
  scheduledStart?: string | null;

  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsNumber()
  estimatedHours?: number;
}
