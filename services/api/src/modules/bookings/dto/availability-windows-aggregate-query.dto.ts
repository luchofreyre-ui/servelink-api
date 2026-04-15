import { Transform, Type } from "class-transformer";
import {
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

/** Franchise owner ids are Prisma `cuid()` strings, not UUIDs. */
function toOptionalTrimmedFoId({ value }: { value: unknown }): string | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const s = String(value).trim();
  return s.length ? s : undefined;
}

/**
 * Query for `GET /bookings/availability/windows/aggregate`.
 * Per-FO windows still come from `SlotAvailabilityService.listAvailableWindows` (one FO at a time);
 * this DTO selects how eligible franchise owners are chosen before fan-out.
 */
export class AvailabilityWindowsAggregateQueryDto {
  @IsOptional()
  @Transform(toOptionalTrimmedFoId)
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  preferredFoId?: string;

  @IsISO8601()
  rangeStart!: string;

  @IsISO8601()
  rangeEnd!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationMinutes!: number;

  /** When set with `siteLng`, `squareFootage`, and `estimatedLaborMinutes`, uses `DispatchCandidateService` filtering. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  siteLat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  siteLng?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50000)
  squareFootage?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  estimatedLaborMinutes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  recommendedTeamSize?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(40)
  maxProviders?: number;
}
