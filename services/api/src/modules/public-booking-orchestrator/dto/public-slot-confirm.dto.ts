import { IsOptional, IsString, MaxLength } from "class-validator";

export class PublicSlotConfirmDto {
  @IsString()
  @MaxLength(128)
  bookingId!: string;

  @IsString()
  @MaxLength(128)
  holdId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
