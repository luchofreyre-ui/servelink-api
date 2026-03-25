import { Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

export class SystemTestReportSummaryIngestDto {
  @IsInt()
  @Min(0)
  totalCount!: number;

  @IsInt()
  @Min(0)
  passedCount!: number;

  @IsInt()
  @Min(0)
  failedCount!: number;

  @IsInt()
  @Min(0)
  skippedCount!: number;

  @IsInt()
  @Min(0)
  flakyCount!: number;
}

export class SystemTestReportCaseIngestDto {
  @IsOptional()
  @IsString()
  suite?: string;

  @IsString()
  @IsNotEmpty()
  filePath!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsString()
  @IsNotEmpty()
  status!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  retryCount?: number;

  @IsOptional()
  @IsInt()
  durationMs?: number;

  @IsOptional()
  @IsString()
  errorMessage?: string | null;

  @IsOptional()
  @IsString()
  errorStack?: string | null;

  @IsOptional()
  @IsString()
  expectedStatus?: string | null;

  @IsOptional()
  @IsInt()
  line?: number | null;

  @IsOptional()
  @IsInt()
  column?: number | null;

  @IsOptional()
  @IsString()
  route?: string | null;

  @IsOptional()
  @IsString()
  selector?: string | null;

  @IsOptional()
  @IsObject()
  artifactJson?: Record<string, unknown> | null;

  @IsObject()
  rawCaseJson!: Record<string, unknown>;
}

export class SystemTestReportIngestDto {
  @IsString()
  @IsNotEmpty()
  source!: string;

  @IsOptional()
  @IsString()
  branch?: string | null;

  @IsOptional()
  @IsString()
  commitSha?: string | null;

  @IsString()
  @IsNotEmpty()
  status!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationMs?: number | null;

  @ValidateNested()
  @Type(() => SystemTestReportSummaryIngestDto)
  summary!: SystemTestReportSummaryIngestDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SystemTestReportCaseIngestDto)
  cases!: SystemTestReportCaseIngestDto[];

  @IsObject()
  rawReportJson!: Record<string, unknown>;
}
