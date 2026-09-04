import { CreatePayrollDto } from './create-payroll.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdatePayrollDto extends PartialType(CreatePayrollDto) {}
