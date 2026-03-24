import { IsArray, IsOptional, IsString } from "class-validator";

export class FoAuthorityKnowledgeLinksRequestDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  surfaces?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  problems?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  methods?: string[];
}
