import { IsOptional, IsString } from "class-validator";

export class ReassignBookingDto {
  /** Optional franchise owner id when reassigning to a specific provider (future use). */
  @IsOptional()
  @IsString()
  targetFoId?: string;
}
