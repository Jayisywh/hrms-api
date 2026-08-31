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
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department-dto';
import { DepartmentsService } from './departments.service';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}
  @Get()
  findAll(@Query('search') search?: string) {
    return this.departmentsService.getAllDepartments(search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.departmentsService.getDepartmentById(id);
  }

  @Post()
  createDepartment(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentsService.createDepartment(createDepartmentDto);
  }

  @Patch(':id')
  updateDepartment(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.updateDepartment(id, updateDepartmentDto);
  }

  @Delete(':id')
  deleteDepartment(@Param('id') id: string) {
    return this.departmentsService.deleteDepartment(id);
  }
}
