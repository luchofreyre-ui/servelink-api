import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  SystemTestIncidentActionPriority,
  SystemTestIncidentActionStatus,
  SystemTestIncidentEventType,
  SystemTestIncidentStepExecutionStatus,
} from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsDefined,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from "class-validator";

export class SystemTestIncidentActionListItemDto {
  @ApiProperty() incidentKey!: string;
  @ApiProperty() status!: SystemTestIncidentActionStatus;
  @ApiProperty() priority!: SystemTestIncidentActionPriority;
  @ApiPropertyOptional() ownerUserId!: string | null;
  @ApiPropertyOptional() ownerName!: string | null;
  @ApiPropertyOptional() lastSeenRunId!: string | null;
  @ApiPropertyOptional() resolvedAt!: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;

  @ApiPropertyOptional() title!: string | null;
  @ApiPropertyOptional() summary!: string | null;
  @ApiPropertyOptional() severity!: string | null;
  @ApiPropertyOptional() runId!: string | null;

  @ApiProperty() totalSteps!: number;
  @ApiProperty() completedSteps!: number;
  @ApiProperty() noteCount!: number;

  @ApiPropertyOptional() validationState!: string | null;
  @ApiPropertyOptional() validationLastCheckedAt!: string | null;
  @ApiPropertyOptional() validationLastPassedAt!: string | null;
  @ApiPropertyOptional() validationLastFailedAt!: string | null;
  @ApiPropertyOptional() reopenedAt!: string | null;
  @ApiProperty() reopenCount!: number;

  @ApiPropertyOptional() slaPolicyHours!: number | null;
  @ApiPropertyOptional() slaStartedAt!: string | null;
  @ApiPropertyOptional() slaDueAt!: string | null;
  @ApiPropertyOptional() slaStatus!: string | null;
  @ApiPropertyOptional() slaLastEvaluatedAt!: string | null;
  @ApiPropertyOptional() escalationReadyAt!: string | null;
}

export class SystemTestIncidentStepExecutionDto {
  @ApiProperty() stepIndex!: number;
  @ApiProperty() status!: SystemTestIncidentStepExecutionStatus;
  @ApiPropertyOptional() notes!: string | null;
  @ApiProperty() updatedAt!: string;
}

export class SystemTestIncidentEventDto {
  @ApiProperty() id!: string;
  @ApiProperty() type!: SystemTestIncidentEventType;
  @ApiPropertyOptional() actorUserId!: string | null;
  @ApiPropertyOptional() actorName!: string | null;
  @ApiPropertyOptional() metadataJson!: Record<string, unknown> | null;
  @ApiProperty() createdAt!: string;
}

export class SystemTestIncidentNoteDto {
  @ApiProperty() id!: string;
  @ApiPropertyOptional() userId!: string | null;
  @ApiPropertyOptional() userName!: string | null;
  @ApiProperty() text!: string;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}

export class SystemTestIncidentActionDetailDto {
  @ApiProperty() incidentKey!: string;
  @ApiProperty() status!: SystemTestIncidentActionStatus;
  @ApiProperty() priority!: SystemTestIncidentActionPriority;
  @ApiPropertyOptional() ownerUserId!: string | null;
  @ApiPropertyOptional() ownerName!: string | null;
  @ApiPropertyOptional() lastSeenRunId!: string | null;
  @ApiPropertyOptional() resolvedAt!: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;

  @ApiPropertyOptional() incidentSummary!: string | null;
  @ApiPropertyOptional() incidentSeverity!: string | null;
  @ApiPropertyOptional() incidentTitle!: string | null;
  @ApiPropertyOptional() currentRunId!: string | null;

  @ApiPropertyOptional() fixTrackPrimaryArea!: string | null;
  @ApiProperty({ type: [String] }) recommendedSteps!: string[];
  @ApiProperty({ type: [String] }) validationSteps!: string[];

  @ApiProperty({ type: [SystemTestIncidentStepExecutionDto] })
  stepExecutions!: SystemTestIncidentStepExecutionDto[];

  @ApiProperty({ type: [SystemTestIncidentNoteDto] })
  notes!: SystemTestIncidentNoteDto[];

  @ApiProperty({ type: [SystemTestIncidentEventDto] })
  events!: SystemTestIncidentEventDto[];

  @ApiPropertyOptional() validationState!: string | null;
  @ApiPropertyOptional() validationLastCheckedAt!: string | null;
  @ApiPropertyOptional() validationLastPassedAt!: string | null;
  @ApiPropertyOptional() validationLastFailedAt!: string | null;
  @ApiPropertyOptional() reopenedAt!: string | null;
  @ApiProperty() reopenCount!: number;
  @ApiProperty() isResolvedAwaitingValidation!: boolean;

  @ApiPropertyOptional() slaPolicyHours!: number | null;
  @ApiPropertyOptional() slaStartedAt!: string | null;
  @ApiPropertyOptional() slaDueAt!: string | null;
  @ApiPropertyOptional() slaStatus!: string | null;
  @ApiPropertyOptional() slaLastEvaluatedAt!: string | null;
  @ApiPropertyOptional() escalationReadyAt!: string | null;
  @ApiProperty() isOverdue!: boolean;
  @ApiProperty() isDueSoon!: boolean;
}

export class UpdateSystemTestIncidentActionOwnerDto {
  @ApiPropertyOptional({ nullable: true, description: "Set null to unassign" })
  @IsDefined()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @IsNotEmpty()
  ownerUserId!: string | null;
}

export class UpdateSystemTestIncidentActionPriorityDto {
  @ApiProperty({ enum: SystemTestIncidentActionPriority })
  @IsEnum(SystemTestIncidentActionPriority)
  priority!: SystemTestIncidentActionPriority;
}

export class UpdateSystemTestIncidentActionStatusDto {
  @ApiProperty({ enum: SystemTestIncidentActionStatus })
  @IsEnum(SystemTestIncidentActionStatus)
  status!: SystemTestIncidentActionStatus;
}

export class AddSystemTestIncidentNoteDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  text!: string;
}

export class UpdateSystemTestIncidentStepExecutionDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  @Max(500)
  stepIndex!: number;

  @ApiProperty({ enum: SystemTestIncidentStepExecutionStatus })
  @IsEnum(SystemTestIncidentStepExecutionStatus)
  status!: SystemTestIncidentStepExecutionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ListSystemTestIncidentActionsQueryDto {
  @ApiPropertyOptional({ enum: SystemTestIncidentActionStatus, isArray: true })
  @IsOptional()
  @IsEnum(SystemTestIncidentActionStatus, { each: true })
  status?: SystemTestIncidentActionStatus[];

  @ApiPropertyOptional({ enum: SystemTestIncidentActionPriority, isArray: true })
  @IsOptional()
  @IsEnum(SystemTestIncidentActionPriority, { each: true })
  priority?: SystemTestIncidentActionPriority[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @ApiPropertyOptional({ isArray: true })
  @IsOptional()
  @IsString({ each: true })
  slaStatus?: string[];

  @ApiPropertyOptional({
    description: "Pass true or 1 to filter escalation-ready actions",
  })
  @IsOptional()
  @IsString()
  escalationReady?: string;

  @ApiPropertyOptional({
    description: "Pass true or 1 for ownerUserId null only",
  })
  @IsOptional()
  @IsString()
  unassignedOnly?: string;
}
