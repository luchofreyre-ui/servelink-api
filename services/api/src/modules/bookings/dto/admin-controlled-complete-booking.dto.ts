import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsString, Max, Min } from "class-validator";

export class AdminControlledCompleteBookingDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24 * 60)
  actualMinutes!: number;

  @IsBoolean()
  confirmControlledCompletion!: boolean;

  @IsString()
  note!: string;
}
