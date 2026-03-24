import { Transform } from "class-transformer";
import { IsInt, IsISO8601, IsOptional, Max, Min } from "class-validator";

/**
 * Shared optional time scope for authority quality/drift endpoints
 * (same semantics as {@link BookingAuthorityReportQueryDto}).
 */
export class BookingAuthorityScopedQueryDto {
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
  @Max(24 * 365)
  windowHours?: number;

  /** Max entries per top-tag list (default 20). */
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
