import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RoleGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../generated/prisma/enums';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Controller('employees')
@UseGuards(JwtAuthGuard, RoleGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @Roles(Role.ADMIN, Role.HR, Role.MANAGER)
  findAll(@Query('search') search?: string) {
    return this.employeesService.getAllEmployees(search);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.HR, Role.MANAGER)
  findOne(@Param('id') id: string) {
    return this.employeesService.getEmployeeById(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.HR)
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.createEmployee(createEmployeeDto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.HR)
  update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeesService.updateEmployee(id, updateEmployeeDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  delete(@Param('id') id: string) {
    return this.employeesService.deleteEmployee(id);
  }
}
