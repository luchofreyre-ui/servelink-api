import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateSystemTestFamilyOperatorStateDto {
  @IsIn(["open", "acknowledged", "dismissed"])
  state!: "open" | "acknowledged" | "dismissed";

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
