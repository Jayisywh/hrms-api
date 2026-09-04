import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AttendanceStatus } from '../../generated/prisma/enums';

export class CreateAttendanceDto {
  @IsUUID()
  @IsNotEmpty()
  employeeId!: string;

  @IsDateString()
  @IsNotEmpty()
  date!: string;

  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @IsOptional()
  @IsDateString()
  checkOut?: string;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
