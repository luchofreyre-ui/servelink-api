import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
} from "class-validator";

export class UpdateNextOccurrenceDto {
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @IsOptional()
  @IsString()
  preferredTimeWindow?: string;

  @IsOptional()
  @IsString()
  preferredFoId?: string;

  @IsOptional()
  @IsString()
  overrideInstructions?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  overrideAddonIds?: string[];
}
