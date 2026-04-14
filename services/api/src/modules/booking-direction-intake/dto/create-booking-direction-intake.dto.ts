import { Transform, Type } from "class-transformer";
import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
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

  /** Optional on the wire: client may omit; server applies defaults for mapping when absent. */
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
