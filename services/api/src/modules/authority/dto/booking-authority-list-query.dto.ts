import { BookingAuthorityReviewStatus } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";

export class ListBookingAuthorityResultsQueryDto {
  @IsOptional()
  @IsEnum(BookingAuthorityReviewStatus)
  status?: BookingAuthorityReviewStatus;

  @IsOptional()
  @Transform(({ value }) => {
    if (value == null || value === "") return undefined;
    const n = parseInt(String(value), 10);
    return Number.isFinite(n) ? n : undefined;
  })
  @IsInt()
  @Min(0)
  @Max(10_000)
  offset?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value == null || value === "") return undefined;
    const n = parseInt(String(value), 10);
    return Number.isFinite(n) ? n : undefined;
  })
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
