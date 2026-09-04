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
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { ApplicationsService } from './applications.service';

@Controller('recruitment/applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.applicationsService.getAllApplications(search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.applicationsService.getApplicationById(id);
  }

  @Post()
  create(@Body() createApplicationDto: CreateApplicationDto) {
    return this.applicationsService.createApplication(createApplicationDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateApplicationDto: UpdateApplicationDto,
  ) {
    return this.applicationsService.updateApplication(id, updateApplicationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.applicationsService.deleteApplication(id);
  }
}
