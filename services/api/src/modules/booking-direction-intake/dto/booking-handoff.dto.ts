import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from "class-validator";

export class BookingHandoffSchedulingDto {
  @IsOptional()
  @IsIn(["preference_only", "slot_selection"])
  mode?: "preference_only" | "slot_selection";

  @IsOptional()
  @Transform(({ value }) => (value === null || value === undefined ? undefined : String(value)))
  @IsString()
  @MaxLength(200)
  preferredTime?: string | null;

  @IsOptional()
  @Transform(({ value }) => (value === null || value === undefined ? undefined : String(value)))
  @IsString()
  @MaxLength(200)
  preferredDayWindow?: string | null;

  @IsOptional()
  @Transform(({ value }) => (value === null || value === undefined ? undefined : String(value)))
  @IsString()
  @MaxLength(2000)
  flexibilityNotes?: string | null;

  @IsOptional()
  @Transform(({ value }) => (value === null || value === undefined ? undefined : String(value)))
  @IsString()
  @MaxLength(200)
  selectedSlotId?: string | null;

  @IsOptional()
  @Transform(({ value }) => (value === null || value === undefined ? undefined : String(value)))
  @IsString()
  @MaxLength(500)
  selectedSlotLabel?: string | null;

  /** Franchise owner id for the selected availability window (matches roster `cleanerId`). */
  @IsOptional()
  @Transform(({ value }) => (value === null || value === undefined ? undefined : String(value)))
  @IsUUID()
  selectedSlotFoId?: string | null;

  @IsOptional()
  @Transform(({ value }) => (value === null || value === undefined ? undefined : String(value)))
  @IsISO8601()
  selectedSlotWindowStart?: string | null;

  @IsOptional()
  @Transform(({ value }) => (value === null || value === undefined ? undefined : String(value)))
  @IsISO8601()
  selectedSlotWindowEnd?: string | null;

  @IsOptional()
  @Transform(({ value }) => (value === null || value === undefined ? undefined : String(value)))
  @IsString()
  @MaxLength(32)
  selectedSlotDate?: string | null;

  /** Last slot hold id created post-submit (funnel-only; optional on persisted handoff). */
  @IsOptional()
  @Transform(({ value }) => (value === null || value === undefined ? undefined : String(value)))
  @IsString()
  @MaxLength(80)
  holdId?: string | null;

  @IsOptional()
  @Transform(({ value }) => (value === null || value === undefined ? undefined : String(value)))
  @IsISO8601()
  holdExpiresAt?: string | null;

  /** True only after `POST /bookings/:id/confirm-hold` succeeds for this booking (optional client echo). */
  @IsOptional()
  @IsBoolean()
  slotHoldConfirmed?: boolean;
}

export class BookingHandoffCleanerPreferenceDto {
  @IsOptional()
  @IsIn(["none", "preferred_cleaner"])
  mode?: "none" | "preferred_cleaner";

  @IsOptional()
  @Transform(({ value }) => (value === null || value === undefined ? undefined : String(value)))
  @IsString()
  @MaxLength(120)
  cleanerId?: string | null;

  @IsOptional()
  @Transform(({ value }) => (value === null || value === undefined ? undefined : String(value)))
  @IsString()
  @MaxLength(500)
  cleanerLabel?: string | null;

  @IsOptional()
  @IsBoolean()
  hardRequirement?: boolean;

  @IsOptional()
  @Transform(({ value }) => (value === null || value === undefined ? undefined : String(value)))
  @IsString()
  @MaxLength(2000)
  notes?: string | null;
}

export class BookingHandoffRecurringDto {
  @IsOptional()
  @IsIn(["one_time", "recurring"])
  pathKind?: "one_time" | "recurring";

  @IsOptional()
  @Transform(({ value }) => (value === null || value === undefined ? undefined : String(value)))
  @IsString()
  @MaxLength(80)
  cadence?: string | null;

  @IsOptional()
  @IsBoolean()
  authRequiredAtConfirm?: boolean;
}

export class BookingHandoffDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => BookingHandoffSchedulingDto)
  scheduling?: BookingHandoffSchedulingDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BookingHandoffCleanerPreferenceDto)
  cleanerPreference?: BookingHandoffCleanerPreferenceDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BookingHandoffRecurringDto)
  recurring?: BookingHandoffRecurringDto;
}
