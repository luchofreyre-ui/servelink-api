import { Type } from "class-transformer";
import { IsInt, IsISO8601, IsString, MaxLength, Min, MinLength } from "class-validator";

export class AvailabilityWindowsQueryDto {
  /** Franchise owner primary key (`FranchiseOwner.id`, typically `cuid()`). */
  @IsString()
  @MinLength(1)
  @MaxLength(128)
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
