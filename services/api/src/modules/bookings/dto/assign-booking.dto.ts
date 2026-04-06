import { IsIn, IsObject, IsOptional, IsString } from "class-validator";

export class AssignBookingDto {
  @IsString()
  foId!: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsIn(["manual", "recommended"])
  assignmentSource?: "manual" | "recommended";

  @IsOptional()
  @IsObject()
  recommendationSummary?: Record<string, unknown>;
}
