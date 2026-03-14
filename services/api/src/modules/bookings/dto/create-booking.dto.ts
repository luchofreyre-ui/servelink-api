import {
  IsDefined,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateBookingDto {
  @IsDefined()
  @IsObject()
  estimateInput!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
