import { IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";

export class FoAuthorityKnowledgeFeedbackDto {
  @IsBoolean()
  helpful!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  selectedKnowledgePath?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
