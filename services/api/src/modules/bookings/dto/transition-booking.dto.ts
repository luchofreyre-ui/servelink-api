import { IsISO8601, IsOptional, IsString } from "class-validator";

export class TransitionBookingDto {
  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsISO8601()
  scheduledStart?: string;
}
