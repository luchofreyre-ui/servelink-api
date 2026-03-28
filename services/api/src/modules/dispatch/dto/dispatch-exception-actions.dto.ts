import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  DispatchExceptionActionEventType,
  DispatchExceptionActionPriority,
  DispatchExceptionActionStatus,
} from "@prisma/client";
import {
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from "class-validator";

export class DispatchExceptionActionListItemDto {
  @ApiProperty() dispatchExceptionKey!: string;
  @ApiProperty() bookingId!: string;
  @ApiPropertyOptional() foId!: string | null;
  @ApiProperty() status!: DispatchExceptionActionStatus;
  @ApiProperty() priority!: DispatchExceptionActionPriority;
  @ApiPropertyOptional() ownerUserId!: string | null;
  @ApiPropertyOptional() ownerName!: string | null;
  @ApiPropertyOptional() lastSeenAt!: string | null;
  @ApiPropertyOptional() lastSeenExceptionId!: string | null;
  @ApiPropertyOptional() resolvedAt!: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;

  @ApiPropertyOptional() exceptionTitle!: string | null;
  @ApiPropertyOptional() exceptionSummary!: string | null;
  @ApiProperty({ type: [String] }) exceptionReasons!: string[];
  @ApiPropertyOptional() latestDecisionStatus!: string | null;
  @ApiPropertyOptional() severity!: string | null;

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

export class DispatchExceptionActionEventDto {
  @ApiProperty() id!: string;
  @ApiProperty() type!: DispatchExceptionActionEventType;
  @ApiPropertyOptional() actorUserId!: string | null;
  @ApiPropertyOptional() actorName!: string | null;
  @ApiPropertyOptional() metadataJson!: Record<string, unknown> | null;
  @ApiProperty() createdAt!: string;
}

export class DispatchExceptionActionNoteDto {
  @ApiProperty() id!: string;
  @ApiPropertyOptional() userId!: string | null;
  @ApiPropertyOptional() userName!: string | null;
  @ApiProperty() text!: string;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}

export class DispatchExceptionActionDetailDto {
  @ApiProperty() dispatchExceptionKey!: string;
  @ApiProperty() bookingId!: string;
  @ApiPropertyOptional() foId!: string | null;
  @ApiProperty() status!: DispatchExceptionActionStatus;
  @ApiProperty() priority!: DispatchExceptionActionPriority;
  @ApiPropertyOptional() ownerUserId!: string | null;
  @ApiPropertyOptional() ownerName!: string | null;
  @ApiPropertyOptional() lastSeenAt!: string | null;
  @ApiPropertyOptional() lastSeenExceptionId!: string | null;
  @ApiPropertyOptional() resolvedAt!: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;

  @ApiPropertyOptional() exceptionTitle!: string | null;
  @ApiPropertyOptional() exceptionSummary!: string | null;
  @ApiProperty({ type: [String] }) exceptionReasons!: string[];
  @ApiPropertyOptional() latestDecisionStatus!: string | null;
  @ApiPropertyOptional() latestTrigger!: string | null;
  @ApiPropertyOptional() latestTriggerDetail!: string | null;
  @ApiPropertyOptional() recommendedAction!: string | null;
  @ApiPropertyOptional() severity!: string | null;
  @ApiPropertyOptional() metadataSnapshot!: Record<string, unknown> | null;

  @ApiProperty({ type: [DispatchExceptionActionNoteDto] })
  notes!: DispatchExceptionActionNoteDto[];

  @ApiProperty({ type: [DispatchExceptionActionEventDto] })
  events!: DispatchExceptionActionEventDto[];

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

export class UpdateDispatchExceptionActionOwnerDto {
  @ApiPropertyOptional({ nullable: true })
  @IsDefined()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @IsNotEmpty()
  ownerUserId!: string | null;
}

export class UpdateDispatchExceptionActionPriorityDto {
  @ApiProperty({ enum: DispatchExceptionActionPriority })
  @IsEnum(DispatchExceptionActionPriority)
  priority!: DispatchExceptionActionPriority;
}

export class UpdateDispatchExceptionActionStatusDto {
  @ApiProperty({ enum: DispatchExceptionActionStatus })
  @IsEnum(DispatchExceptionActionStatus)
  status!: DispatchExceptionActionStatus;
}

export class AddDispatchExceptionActionNoteDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  text!: string;
}
