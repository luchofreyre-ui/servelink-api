import { Transform } from "class-transformer";
import { IsInt, IsISO8601, IsOptional, Max, Min } from "class-validator";

export class BookingAuthorityReportQueryDto {
  /** Max entries per top-tags list (problems, surfaces, methods). */
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

  /**
   * Recent reviewed/overridden rows. Set to `0` to omit that section.
   * @default 10
   */
  @IsOptional()
  @Transform(({ value }) => {
    if (value == null || value === "") return undefined;
    const n = parseInt(String(value), 10);
    return Number.isFinite(n) ? n : undefined;
  })
  @IsInt()
  @Min(0)
  @Max(50)
  recentLimit?: number;

  /**
   * Only include `BookingAuthorityResult` rows with `updatedAt >=` this instant (ISO-8601).
   * Takes precedence over `windowHours` when both are sent.
   */
  @IsOptional()
  @Transform(({ value }) =>
    value == null || value === "" ? undefined : String(value).trim(),
  )
  @IsISO8601({ strict: true })
  updatedSince?: string;

  /**
   * Only include rows with `updatedAt >= now - windowHours` (whole hours).
   * Ignored when `updatedSince` is set.
   */
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
}
