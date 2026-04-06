import { IsOptional, IsString } from "class-validator";

export class CreateBookingCheckoutDto {
  @IsOptional()
  @IsString()
  actorUserId?: string | null;

  @IsOptional()
  @IsString()
  actorRole?: string | null;

  @IsOptional()
  @IsString()
  successUrl?: string | null;

  @IsOptional()
  @IsString()
  cancelUrl?: string | null;
}
