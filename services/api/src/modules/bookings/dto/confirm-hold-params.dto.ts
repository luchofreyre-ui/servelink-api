import { IsString, MaxLength, MinLength } from "class-validator";

export class ConfirmHoldParamsDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  id!: string;
}
