import { Transform } from "class-transformer";
import { IsInt, IsISO8601, IsOptional, Max, Min } from "class-validator";

export class BookingAuthorityAlertsQueryDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value == null || value === "") return undefined;
    const n = parseInt(String(value), 10);
    return Number.isFinite(n) ? n : undefined;
  })
  @IsInt()
  @Min(1)
  @Max(24 * 365)
  windowHours?: number;

  @IsOptional()
  @Transform(({ value }) =>
    value == null || value === "" ? undefined : String(value).trim(),
  )
  @IsISO8601({ strict: true })
  updatedSince?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value == null || value === "") return undefined;
    const n = parseInt(String(value), 10);
    return Number.isFinite(n) ? n : undefined;
  })
  @IsInt()
  @Min(1)
  @Max(5000)
  minSampleSize?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value == null || value === "") return undefined;
    const n = parseFloat(String(value));
    return Number.isFinite(n) ? n : undefined;
  })
  @Min(0)
  @Max(1)
  overrideRateHighThreshold?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value == null || value === "") return undefined;
    const n = parseFloat(String(value));
    return Number.isFinite(n) ? n : undefined;
  })
  @Min(0)
  @Max(1)
  reviewRateLowThreshold?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value == null || value === "") return undefined;
    const n = parseInt(String(value), 10);
    return Number.isFinite(n) ? n : undefined;
  })
  @IsInt()
  @Min(1)
  @Max(10000)
  mismatchTypeMinCount?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value == null || value === "") return undefined;
    const n = parseInt(String(value), 10);
    return Number.isFinite(n) ? n : undefined;
  })
  @IsInt()
  @Min(1)
  @Max(10000)
  unstableTagScoreMin?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value == null || value === "") return undefined;
    const n = parseInt(String(value), 10);
    return Number.isFinite(n) ? n : undefined;
  })
  @IsInt()
  @Min(1)
  @Max(100)
  topLimit?: number;
}
