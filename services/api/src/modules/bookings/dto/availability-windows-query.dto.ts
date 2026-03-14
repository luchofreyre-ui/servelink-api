import { Type } from "class-transformer";
import { IsISO8601, IsInt, IsUUID, Min } from "class-validator";

export class AvailabilityWindowsQueryDto {
  @IsUUID()
  foId!: string;

  @IsISO8601()
  rangeStart!: string;

  @IsISO8601()
  rangeEnd!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationMinutes!: number;
}
