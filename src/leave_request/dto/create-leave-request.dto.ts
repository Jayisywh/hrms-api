import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { LeaveType } from '../../generated/prisma/client';

export class CreateLeaveRequestDto {
  @IsUUID()
  employeeId!: string;

  @IsEnum(LeaveType)
  leaveType!: LeaveType;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
