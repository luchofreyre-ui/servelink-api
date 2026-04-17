import { IsISO8601, IsString, MaxLength } from "class-validator";

/** Select a concrete slot window for a hold (FO + start/end from availability). */
export class PublicSlotSelectDto {
  @IsString()
  @MaxLength(128)
  bookingId!: string;

  @IsString()
  @MaxLength(128)
  foId!: string;

  @IsISO8601()
  startAt!: string;

  @IsISO8601()
  endAt!: string;
}
