import { BookingPaymentStatus } from "@prisma/client";
import { IsEnum, IsObject, IsOptional, IsString } from "class-validator";

export class UpdateBookingPaymentStatusDto {
  @IsEnum(BookingPaymentStatus)
  nextStatus!: BookingPaymentStatus;

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
