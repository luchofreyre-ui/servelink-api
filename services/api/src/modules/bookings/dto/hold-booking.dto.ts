import { IsObject, IsOptional, IsString } from "class-validator";

export class HoldBookingDto {
  @IsOptional()
  @IsString()
  actorUserId?: string | null;

  @IsOptional()
  @IsString()
  actorRole?: string | null;

  @IsOptional()
  @IsString()
  note?: string | null;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown> | null;
}
