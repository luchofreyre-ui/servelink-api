import { IsISO8601, IsOptional, IsString, MaxLength } from "class-validator";

/** Select a concrete slot window for a hold (FO + start/end from availability). */
export class PublicSlotSelectDto {
  @IsString()
  @MaxLength(128)
  bookingId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  slotId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  foId?: string;

  @IsOptional()
  @IsISO8601()
  startAt?: string;

  @IsOptional()
  @IsISO8601()
  endAt?: string;
}
