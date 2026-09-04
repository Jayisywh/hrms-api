import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { PayrollStatus } from '../../generated/prisma/enums';

export class CreatePayrollDto {
  @IsUUID()
  @IsNotEmpty()
  employeeId!: string;

  @IsString()
  @IsNotEmpty()
  period!: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  baseSalary!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  allowances?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deductions?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  netPay?: number;

  @IsOptional()
  @IsEnum(PayrollStatus)
  status?: PayrollStatus;

  @IsOptional()
  @IsDateString()
  processedAt?: string;
}
