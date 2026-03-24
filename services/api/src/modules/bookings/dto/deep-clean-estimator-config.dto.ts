import { Type } from "class-transformer";
import {
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

export class DeepCleanVisitDurationMultipliersDto {
  @IsNumber()
  @Min(0.5)
  @Max(2)
  visit1!: number;

  @IsNumber()
  @Min(0.5)
  @Max(2)
  visit2!: number;

  @IsNumber()
  @Min(0.5)
  @Max(2)
  visit3!: number;
}

export class DeepCleanEstimatorConfigBodyDto {
  @IsNumber()
  @Min(0.5)
  @Max(2)
  globalDurationMultiplier!: number;

  @IsNumber()
  @Min(0.5)
  @Max(2)
  singleVisitDurationMultiplier!: number;

  @IsNumber()
  @Min(0.5)
  @Max(2)
  threeVisitDurationMultiplier!: number;

  @ValidateNested()
  @Type(() => DeepCleanVisitDurationMultipliersDto)
  visitDurationMultipliers!: DeepCleanVisitDurationMultipliersDto;

  @IsNumber()
  @Min(-120)
  @Max(240)
  bedroomAdditiveMinutes!: number;

  @IsNumber()
  @Min(-120)
  @Max(240)
  bathroomAdditiveMinutes!: number;

  @IsNumber()
  @Min(-120)
  @Max(240)
  petAdditiveMinutes!: number;

  @IsNumber()
  @Min(-120)
  @Max(240)
  kitchenHeavySoilAdditiveMinutes!: number;

  @IsNumber()
  @Min(0)
  @Max(720)
  minimumVisitDurationMinutes!: number;

  @IsNumber()
  @Min(0)
  @Max(720)
  minimumProgramDurationMinutes!: number;
}

export class UpdateDeepCleanEstimatorDraftRequestDto {
  @IsOptional()
  @IsString()
  label?: string;

  @ValidateNested()
  @Type(() => DeepCleanEstimatorConfigBodyDto)
  config!: DeepCleanEstimatorConfigBodyDto;
}

export class PreviewDeepCleanEstimatorRequestDto {
  @IsObject()
  estimateInput!: Record<string, unknown>;
}
