import { IsOptional, IsString, MaxLength } from "class-validator";

export class PublicDepositPrepareDto {
  @IsString()
  @MaxLength(128)
  bookingId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  holdId?: string;
}
