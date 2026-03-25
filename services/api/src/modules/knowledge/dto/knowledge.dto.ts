import { IsIn, IsString } from "class-validator";
import { KnowledgeSeverity } from "../knowledge.types";

const KNOWLEDGE_SEVERITIES: KnowledgeSeverity[] = ["light", "medium", "heavy"];

export class KnowledgeQuickSolveQueryDto {
  @IsString()
  surfaceId!: string;

  @IsString()
  problemId!: string;

  @IsString()
  @IsIn(KNOWLEDGE_SEVERITIES)
  severity!: KnowledgeSeverity;
}
