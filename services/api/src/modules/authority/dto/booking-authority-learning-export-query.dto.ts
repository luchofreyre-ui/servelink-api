import { Transform } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class BookingAuthorityLearningExportQueryDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value == null || value === "") return undefined;
    const n = parseInt(String(value), 10);
    return Number.isFinite(n) ? n : undefined;
  })
  @IsInt()
  @Min(0)
  @Max(10_000)
  offset?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value == null || value === "") return undefined;
    const n = parseInt(String(value), 10);
    return Number.isFinite(n) ? n : undefined;
  })
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  /** Rolling window in hours; filters rows by `BookingAuthorityResult.updatedAt >= now - windowHours`. */
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
  @IsString()
  updatedSince?: string;
}
