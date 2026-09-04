import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { EmployeeStatus, EmploymentType } from '../../generated/prisma/enums';

export class CreateEmployeeDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  employeeCode?: string;

  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsISO8601()
  dateOfBirth?: string;

  @IsISO8601()
  @IsNotEmpty()
  hireDate!: string;

  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsUUID()
  @IsNotEmpty()
  departmentId!: string;

  @IsUUID()
  @IsNotEmpty()
  positionId!: string;

  @IsOptional()
  @IsUUID()
  managerId?: string;
}
