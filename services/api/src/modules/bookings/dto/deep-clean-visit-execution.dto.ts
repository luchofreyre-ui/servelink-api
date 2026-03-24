import { Type } from "class-transformer";
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export type DeepCleanVisitExecutionStatusApi =
  | "not_started"
  | "in_progress"
  | "completed";

export class CompleteDeepCleanVisitDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(24 * 60 * 7)
  actualDurationMinutes?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  operatorNote?: string | null;
}

export type DeepCleanVisitExecutionResponseDto = {
  visitNumber: number;
  status: DeepCleanVisitExecutionStatusApi;
  startedAt: string | null;
  completedAt: string | null;
  actualDurationMinutes: number | null;
  operatorNote: string | null;
};
