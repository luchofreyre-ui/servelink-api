import { IsString, MaxLength, MinLength } from "class-validator";

export class UpdateOperatorNoteDto {
  @IsString()
  @MinLength(1, { message: "note must not be empty" })
  @MaxLength(20000)
  note!: string;
}
