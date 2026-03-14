import { IsUUID } from "class-validator";

export class ConfirmHoldParamsDto {
  @IsUUID()
  id!: string;
}
