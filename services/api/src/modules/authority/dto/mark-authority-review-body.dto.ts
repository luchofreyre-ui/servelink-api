import { BookingAuthorityMismatchType } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class MarkAuthorityReviewBodyDto {
  @IsOptional()
  @IsEnum(BookingAuthorityMismatchType)
  mismatchType?: BookingAuthorityMismatchType;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  mismatchNotes?: string;
}
