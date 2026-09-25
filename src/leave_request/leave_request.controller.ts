import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { LeaveRequestService } from './leave_request.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';

@Controller('leave-requests')
export class LeaveRequestController {
  constructor(private readonly leaveRequestService: LeaveRequestService) {}

  @Post()
  create(@Body() dto: CreateLeaveRequestDto) {
    return this.leaveRequestService.create(dto);
  }

  @Get()
  findAll() {
    return this.leaveRequestService.findAll();
  }

  @Get('employee/:employeeId')
  findByEmployee(@Param('employeeId') employeeId: string) {
    return this.leaveRequestService.findByEmployee(employeeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leaveRequestService.findOne(id);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.leaveRequestService.approve(id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.leaveRequestService.reject(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.leaveRequestService.remove(id);
  }
}
