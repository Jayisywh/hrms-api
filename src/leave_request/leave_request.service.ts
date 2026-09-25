import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { LeaveStatus } from '../generated/prisma/client';

@Injectable()
export class LeaveRequestService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLeaveRequestDto) {
    const employee = await this.prisma.employee.findUnique({
      where: {
        id: dto.employeeId,
      },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate > endDate) {
      throw new BadRequestException('Start date cannot be after end date');
    }

    return this.prisma.leaveRequest.create({
      data: {
        employeeId: dto.employeeId,
        leaveType: dto.leaveType,
        startDate: startDate,
        endDate: endDate,
        reason: dto.reason,
      },
      include: {
        employee: true,
      },
    });
  }

  async findAll() {
    return this.prisma.leaveRequest.findMany({
      include: {
        employee: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const leaveRequest = await this.prisma.leaveRequest.findUnique({
      where: {
        id: id,
      },
      include: {
        employee: true,
      },
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    return leaveRequest;
  }

  async findByEmployee(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: {
        id: employeeId,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return this.prisma.leaveRequest.findMany({
      where: {
        employeeId: employeeId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async approve(id: string) {
    const leaveRequest = await this.findOne(id);

    if (leaveRequest.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(
        'Only pending leave requests can be approved',
      );
    }

    return this.prisma.leaveRequest.update({
      where: {
        id,
      },
      data: {
        status: LeaveStatus.APPROVED,
      },
    });
  }

  async reject(id: string) {
    const leaveRequest = await this.findOne(id);

    if (leaveRequest.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(
        'Only pending leave requests can be rejected',
      );
    }

    return this.prisma.leaveRequest.update({
      where: {
        id,
      },
      data: {
        status: LeaveStatus.REJECTED,
      },
    });
  }

  async remove(id: string) {
    const leaveRequest = await this.findOne(id);
    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    if (leaveRequest.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(
        'Only pending leave requests can be deleted',
      );
    }

    return this.prisma.leaveRequest.delete({
      where: { id },
    });
  }
}
