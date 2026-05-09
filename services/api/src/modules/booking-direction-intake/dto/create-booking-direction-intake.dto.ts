import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";
import { ESTIMATE_BATHROOMS, ESTIMATE_BEDROOMS } from "./estimate-factor-enums";
import { EstimateFactorsDto } from "./estimate-factors.dto";

/** Matches `apps/web/.../bookingContactValidation.ts` (funnel email gate). */
const BOOKING_INTAKE_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * After comma stripping, require explicit sqft 300–99999 (matches mapper strictness).
 * Allows 3-digit (300–999) or 4–5 digit values.
 */
const HOME_SIZE_SQFT_PATTERN = /(?:^|[^\d])([3-9]\d{2}|\d{4,5})(?:[^\d]|$)/;

/** Service address where cleaning occurs — used for geocoding and booking.site*. */
export class PublicServiceLocationDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(3)
  @MaxLength(400)
  street!: string;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  city!: string;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  state!: string;

  @Transform(({ value }) => (typeof value === "string" ? value.replace(/\s/g, "").trim() : value))
  @IsString()
  @MinLength(5)
  @MaxLength(16)
  zip!: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value !== "string") return value;
    const t = value.trim();
    return t.length ? t : undefined;
  })
  @IsString()
  @MaxLength(80)
  unit?: string;
}

export class BookingDirectionUtmDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  medium?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  campaign?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  term?: string;
}

export class BookingDirectionRecurringInterestDto {
  @IsOptional()
  @IsBoolean()
  interested?: boolean;

  @IsOptional()
  @IsIn(["weekly", "every_10_days", "biweekly", "monthly", "not_sure", "none"])
  cadence?: "weekly" | "every_10_days" | "biweekly" | "monthly" | "not_sure" | "none";

  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value !== "string") return value;
    const t = value.trim();
    return t.length ? t : undefined;
  })
  @IsString()
  @MaxLength(120)
  sourceIntent?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value !== "string") return value;
    const t = value.trim();
    return t.length ? t : undefined;
  })
  @IsString()
  @MaxLength(2500)
  note?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value !== "string") return value;
    const t = value.trim();
    return t.length ? t : undefined;
  })
  @IsString()
  @MaxLength(80)
  capturedAt?: string;
}

export class CreateBookingDirectionIntakeDto {
  @IsString()
  @MaxLength(120)
  serviceId!: string;

  @Transform(({ value }) => {
    if (typeof value !== "string") return value;
    return value.replace(/,/g, "");
  })
  @IsString()
  @MaxLength(500)
  @Matches(HOME_SIZE_SQFT_PATTERN, {
    message:
      "homeSize must include explicit square footage (300–99999), e.g. 2200 or 2,200 sq ft",
  })
  homeSize!: string;

  @IsString()
  @IsIn([...ESTIMATE_BEDROOMS])
  bedrooms!: (typeof ESTIMATE_BEDROOMS)[number];

  @IsString()
  @IsIn([...ESTIMATE_BATHROOMS])
  bathrooms!: (typeof ESTIMATE_BATHROOMS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(200)
  pets?: string;

  /**
   * Public `/book` Step 2 questionnaire mapped into estimator tokens.
   * When omitted, server applies `DEFAULT_PUBLIC_FUNNEL_ESTIMATE_FACTORS` before estimate.
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => EstimateFactorsDto)
  estimateFactors?: EstimateFactorsDto;

  @IsString()
  @MaxLength(80)
  frequency!: string;

  @IsString()
  @MaxLength(120)
  preferredTime!: string;

  /** Optional franchise-owner preference for public scheduling (cuid-shaped id). */
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value !== "string") return value;
    const t = value.trim();
    return t.length ? t : undefined;
  })
  @IsString()
  @MaxLength(128)
  preferredFoId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requestedEnhancementIds?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => BookingDirectionRecurringInterestDto)
  recurringInterest?: BookingDirectionRecurringInterestDto;

  /** Only stored when service is deep clean; otherwise ignored. */
  @IsOptional()
  @IsIn(["single_visit", "phased_3_visit"])
  deepCleanProgram?: "single_visit" | "phased_3_visit";

  @IsOptional()
  @IsString()
  @MaxLength(200)
  source?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => BookingDirectionUtmDto)
  utm?: BookingDirectionUtmDto;

  /**
   * Public `/book` sends a complete service address for geocoding + team matching.
   * Optional for legacy callers; preview/submit reject when absent (see bridge).
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => PublicServiceLocationDto)
  serviceLocation?: PublicServiceLocationDto;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value !== "string") return value;
    const t = value.trim();
    return t.length ? t : undefined;
  })
  @IsString()
  @MaxLength(200)
  customerName?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value !== "string") return value;
    const t = value.trim();
    return t.length ? t : undefined;
  })
  @IsString()
  @MaxLength(320)
  @Matches(BOOKING_INTAKE_EMAIL_PATTERN, {
    message: "customerEmail must be a valid email address",
  })
  customerEmail?: string;
}
