import { Transform, Type } from "class-transformer";
import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from "class-validator";

/** Matches `apps/web/.../bookingContactValidation.ts` (funnel email gate). */
const BOOKING_INTAKE_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  @IsString()
  @MaxLength(500)
  homeSize!: string;

  @IsString()
  @MaxLength(80)
  bedrooms!: string;

  @IsString()
  @MaxLength(80)
  bathrooms!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  pets?: string;

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
