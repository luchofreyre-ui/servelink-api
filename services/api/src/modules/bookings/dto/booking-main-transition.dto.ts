import { BookingStatus } from "@prisma/client";
import { IsEnum, IsISO8601, IsOptional, IsString } from "class-validator";

export class BookingMainTransitionDto {
  @IsEnum(BookingStatus)
  nextStatus!: BookingStatus;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsISO8601()
  scheduledStart?: string;

  @IsOptional()
  @IsString()
  foId?: string;

  @IsOptional()
  @IsString()
  actorUserId?: string | null;

  @IsOptional()
  @IsString()
  actorRole?: string | null;
}
