import { IsISO8601, IsOptional, IsString, Matches, MaxLength } from "class-validator";

/**
 * Public availability for an existing booking.
 * - Without `foId`: returns ranked team options (up to 2), no slot windows.
 * - With `foId`: returns slot windows for that team only (must be a valid candidate).
 */
export class PublicAvailabilityQueryDto {
  @IsString()
  @MaxLength(128)
  bookingId!: string;

  /** When set, return windows only for this franchise owner (team). */
  @IsOptional()
  @IsString()
  @MaxLength(128)
  foId?: string;

  /** Optional calendar day hint `YYYY-MM-DD` (UTC midnight anchor for range). */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "preferredDate must be YYYY-MM-DD",
  })
  preferredDate?: string;

  @IsOptional()
  @IsISO8601()
  rangeStart?: string;

  @IsOptional()
  @IsISO8601()
  rangeEnd?: string;
}
