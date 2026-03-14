import { IsISO8601, IsUUID } from "class-validator";

export class CreateSlotHoldDto {
  @IsUUID()
  bookingId!: string;

  @IsUUID()
  foId!: string;

  @IsISO8601()
  startAt!: string;

  @IsISO8601()
  endAt!: string;
}
