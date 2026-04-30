import { Type } from "class-transformer";
import { IsISO8601, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class TransitionBookingDto {
  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsISO8601()
  scheduledStart?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24 * 60)
  actualMinutes?: number;
}
