import { IsISO8601, IsString, MaxLength, MinLength } from "class-validator";

export class CreateSlotHoldDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  bookingId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  foId!: string;

  @IsISO8601()
  startAt!: string;

  @IsISO8601()
  endAt!: string;
}
