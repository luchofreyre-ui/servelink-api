import {
  IsEnum,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export enum CreateAdminDispatchDecisionAction {
  approve_assignment = "approve_assignment",
  reassign = "reassign",
  hold = "hold",
  escalate = "escalate",
  request_review = "request_review",
}

export class CreateAdminDispatchDecisionDto {
  @IsString()
  @MinLength(1)
  bookingId!: string;

  @IsEnum(CreateAdminDispatchDecisionAction)
  action!: CreateAdminDispatchDecisionAction;

  @IsString()
  @MinLength(20)
  rationale!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  targetFoId?: string;

  @IsISO8601()
  submittedAt!: string;

  @IsString()
  @IsIn(["admin"])
  submittedByRole!: "admin";

  @IsString()
  @IsIn(["admin_booking_detail", "admin_exceptions", "admin_dashboard", "unknown"])
  source!: "admin_booking_detail" | "admin_exceptions" | "admin_dashboard" | "unknown";
}
