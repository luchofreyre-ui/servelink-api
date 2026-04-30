import { BookingStatus } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsISO8601, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

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

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24 * 60)
  actualMinutes?: number;
}
