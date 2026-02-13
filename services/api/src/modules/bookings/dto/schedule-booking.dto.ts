import { IsISO8601, IsOptional, IsString } from 'class-validator';

export class ScheduleBookingDto {
  @IsISO8601()
  scheduledAt!: string;

  @IsOptional()
  @IsString()
  note?: string;
}
