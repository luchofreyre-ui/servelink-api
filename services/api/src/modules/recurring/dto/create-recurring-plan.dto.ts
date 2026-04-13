import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
} from "class-validator";

export enum RecurringCadenceDto {
  weekly = "weekly",
  biweekly = "biweekly",
  monthly = "monthly",
}

export class CreateRecurringPlanDto {
  @IsEnum(RecurringCadenceDto)
  cadence!: RecurringCadenceDto;

  @IsString()
  serviceType!: string;

  @IsOptional()
  @IsString()
  preferredTimeWindow?: string;

  @IsOptional()
  @IsString()
  preferredFoId?: string;

  @IsOptional()
  @IsString()
  bookingNotes?: string;

  @IsArray()
  @IsString({ each: true })
  defaultAddonIds!: string[];

  @IsDateString()
  nextAnchorAt!: string;

  @IsObject()
  @IsNotEmptyObject()
  estimateSnapshot!: Record<string, unknown>;

  @IsObject()
  @IsNotEmptyObject()
  pricingSnapshot!: Record<string, unknown>;

  @IsObject()
  @IsNotEmptyObject()
  intakeSnapshot!: Record<string, unknown>;

  @IsObject()
  @IsNotEmptyObject()
  addressSnapshot!: Record<string, unknown>;
}
