import { IsOptional, IsString } from 'class-validator';

export class CreateBookingDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
