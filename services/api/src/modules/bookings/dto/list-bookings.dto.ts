import { BookingStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class ListBookingsDto {
  @IsOptional()
  @IsString()
  role?: "admin" | "fo" | "customer";

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsString()
  assignedFoUserId?: string;

  @IsOptional()
  @IsString()
  customerUserId?: string;

  @IsOptional()
  @IsString()
  includeEvents?: string;

  @IsOptional()
  @IsString()
  view?: "default" | "dispatch" | "fo" | "customer";
}
