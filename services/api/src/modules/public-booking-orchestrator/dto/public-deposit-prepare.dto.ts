import { IsString, MaxLength } from "class-validator";

export class PublicDepositPrepareDto {
  @IsString()
  @MaxLength(128)
  bookingId!: string;
}
