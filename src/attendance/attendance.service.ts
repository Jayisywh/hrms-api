import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllAttendance(search?: string) {
    return this.prisma.attendance.findMany({
      where: search
        ? {
            OR: [
              {
                employee: {
                  firstName: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                employee: {
                  lastName: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                employee: {
                  employeeCode: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                notes: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {},
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async getAttendanceById(id: string) {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!attendance) {
      throw new NotFoundException(`Attendance record with id ${id} not found`);
    }

    return attendance;
  }

  async createAttendance(createAttendanceDto: CreateAttendanceDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: createAttendanceDto.employeeId },
    });

    if (!employee) {
      throw new NotFoundException(
        `Employee with id ${createAttendanceDto.employeeId} not found`,
      );
    }

    const existing = await this.prisma.attendance.findFirst({
      where: {
        employeeId: createAttendanceDto.employeeId,
        date: new Date(createAttendanceDto.date),
      },
    });

    if (existing) {
      throw new ConflictException(
        `Attendance record already exists for employee ${createAttendanceDto.employeeId} on ${createAttendanceDto.date}`,
      );
    }

    return this.prisma.attendance.create({
      data: {
        employeeId: createAttendanceDto.employeeId,
        date: new Date(createAttendanceDto.date),
        checkIn: createAttendanceDto.checkIn
          ? new Date(createAttendanceDto.checkIn)
          : undefined,
        checkOut: createAttendanceDto.checkOut
          ? new Date(createAttendanceDto.checkOut)
          : undefined,
        status: createAttendanceDto.status,
        notes: createAttendanceDto.notes,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async updateAttendance(id: string, updateAttendanceDto: UpdateAttendanceDto) {
    await this.getAttendanceById(id);

    const data: Record<string, unknown> = {};
    if (updateAttendanceDto.date !== undefined) {
      data.date = new Date(updateAttendanceDto.date);
    }
    if (updateAttendanceDto.checkIn !== undefined) {
      data.checkIn = updateAttendanceDto.checkIn
        ? new Date(updateAttendanceDto.checkIn)
        : null;
    }
    if (updateAttendanceDto.checkOut !== undefined) {
      data.checkOut = updateAttendanceDto.checkOut
        ? new Date(updateAttendanceDto.checkOut)
        : null;
    }
    if (updateAttendanceDto.status !== undefined) {
      data.status = updateAttendanceDto.status;
    }
    if (updateAttendanceDto.notes !== undefined) {
      data.notes = updateAttendanceDto.notes;
    }
    if (updateAttendanceDto.employeeId !== undefined) {
      data.employeeId = updateAttendanceDto.employeeId;
    }

    return this.prisma.attendance.update({
      where: { id },
      data,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async deleteAttendance(id: string) {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
    });

    if (!attendance) {
      throw new NotFoundException(`Attendance record with id ${id} not found`);
    }

    return this.prisma.attendance.delete({ where: { id } });
  }
}
