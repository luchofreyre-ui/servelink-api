import { IsIn, IsObject, IsOptional, IsString, ValidateIf } from "class-validator";
import { PUBLIC_BOOKING_FUNNEL_MILESTONE_KEYS } from "../public-booking-funnel-milestone.constants";

export class PublicBookingFunnelMilestoneDto {
  @IsString()
  @IsIn([...PUBLIC_BOOKING_FUNNEL_MILESTONE_KEYS])
  milestone!: (typeof PUBLIC_BOOKING_FUNNEL_MILESTONE_KEYS)[number];

  @IsOptional()
  @IsString()
  bookingId?: string;

  @IsOptional()
  @IsString()
  intakeId?: string;

  @ValidateIf((_o, v) => v !== undefined)
  @IsObject()
  payload?: Record<string, unknown>;
}
