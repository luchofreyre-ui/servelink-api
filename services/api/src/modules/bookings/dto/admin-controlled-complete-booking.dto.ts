import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class AdminControlledCompleteBookingDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24 * 60)
  actualMinutes!: number;

  @IsBoolean()
  confirmControlledCompletion!: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}
