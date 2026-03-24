import { Transform } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class BookingAuthorityUnmappedTagsQueryDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value == null || value === "") return undefined;
    const n = parseInt(String(value), 10);
    return Number.isFinite(n) ? n : undefined;
  })
  @IsInt()
  @Min(1)
  @Max(24 * 365)
  windowHours?: number;

  @IsOptional()
  @IsString()
  updatedSince?: string;

  /** Max authority rows scanned (newest first). */
  @IsOptional()
  @Transform(({ value }) => {
    if (value == null || value === "") return undefined;
    const n = parseInt(String(value), 10);
    return Number.isFinite(n) ? n : undefined;
  })
  @IsInt()
  @Min(1)
  @Max(2000)
  maxRowsScan?: number;
}
