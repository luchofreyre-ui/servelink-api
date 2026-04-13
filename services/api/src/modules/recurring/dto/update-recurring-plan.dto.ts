import { IsIn, IsOptional, IsString } from "class-validator";

export const UPDATE_RECURRING_PLAN_CADENCE = [
  "weekly",
  "biweekly",
  "monthly",
] as const;

export const UPDATE_RECURRING_PLAN_ACTION = [
  "pause",
  "resume",
  "cancel",
] as const;

export type UpdateRecurringPlanCadence = (typeof UPDATE_RECURRING_PLAN_CADENCE)[number];
export type UpdateRecurringPlanAction = (typeof UPDATE_RECURRING_PLAN_ACTION)[number];

export class UpdateRecurringPlanDto {
  @IsOptional()
  @IsIn(UPDATE_RECURRING_PLAN_CADENCE)
  cadence?: UpdateRecurringPlanCadence;

  @IsOptional()
  @IsIn(UPDATE_RECURRING_PLAN_ACTION)
  action?: UpdateRecurringPlanAction;

  @IsOptional()
  @IsString()
  preferredTimeWindow?: string;

  @IsOptional()
  @IsString()
  preferredFoId?: string;

  @IsOptional()
  @IsString()
  bookingNotes?: string;
}
