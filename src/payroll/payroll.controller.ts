import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreatePayrollDto } from './dto/create-payroll.dto';
import { UpdatePayrollDto } from './dto/update-payroll.dto';
import { PayrollService } from './payroll.service';

@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.payrollService.getAllPayrolls(search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.payrollService.getPayrollById(id);
  }

  @Post()
  create(@Body() createPayrollDto: CreatePayrollDto) {
    return this.payrollService.createPayroll(createPayrollDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePayrollDto: UpdatePayrollDto) {
    return this.payrollService.updatePayroll(id, updatePayrollDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.payrollService.deletePayroll(id);
  }
}
