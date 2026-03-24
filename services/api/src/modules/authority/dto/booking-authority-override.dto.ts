import { BookingAuthorityMismatchType } from "@prisma/client";
import { IsArray, IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class OverrideBookingAuthorityTagsDto {
  @IsArray()
  @IsString({ each: true })
  surfaces!: string[];

  @IsArray()
  @IsString({ each: true })
  problems!: string[];

  @IsArray()
  @IsString({ each: true })
  methods!: string[];

  /** Operator rationale; when omitted, existing overrideReasonsJson is left unchanged. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  overrideReasons?: string[];

  @IsOptional()
  @IsEnum(BookingAuthorityMismatchType)
  mismatchType?: BookingAuthorityMismatchType;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  mismatchNotes?: string;
}
