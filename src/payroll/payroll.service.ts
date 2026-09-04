import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePayrollDto } from './dto/create-payroll.dto';
import { UpdatePayrollDto } from './dto/update-payroll.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllPayrolls(search?: string) {
    return this.prisma.payroll.findMany({
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
                period: {
                  contains: search,
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPayrollById(id: string) {
    const payroll = await this.prisma.payroll.findUnique({
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

    if (!payroll) {
      throw new NotFoundException(`Payroll record with id ${id} not found`);
    }

    return payroll;
  }

  async createPayroll(createPayrollDto: CreatePayrollDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: createPayrollDto.employeeId },
    });

    if (!employee) {
      throw new NotFoundException(
        `Employee with id ${createPayrollDto.employeeId} not found`,
      );
    }

    const existing = await this.prisma.payroll.findFirst({
      where: {
        employeeId: createPayrollDto.employeeId,
        period: createPayrollDto.period,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Payroll record already exists for employee ${createPayrollDto.employeeId} in period ${createPayrollDto.period}`,
      );
    }

    const allowances = createPayrollDto.allowances ?? 0;
    const deductions = createPayrollDto.deductions ?? 0;
    const netPay =
      createPayrollDto.netPay ??
      createPayrollDto.baseSalary + allowances - deductions;

    return this.prisma.payroll.create({
      data: {
        employeeId: createPayrollDto.employeeId,
        period: createPayrollDto.period,
        baseSalary: createPayrollDto.baseSalary,
        allowances,
        deductions,
        netPay,
        status: createPayrollDto.status,
        processedAt: createPayrollDto.processedAt
          ? new Date(createPayrollDto.processedAt)
          : undefined,
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

  async updatePayroll(id: string, updatePayrollDto: UpdatePayrollDto) {
    await this.getPayrollById(id);

    const data: Record<string, unknown> = {};
    if (updatePayrollDto.employeeId !== undefined) {
      data.employeeId = updatePayrollDto.employeeId;
    }
    if (updatePayrollDto.period !== undefined) {
      data.period = updatePayrollDto.period;
    }
    if (updatePayrollDto.baseSalary !== undefined) {
      data.baseSalary = updatePayrollDto.baseSalary;
    }
    if (updatePayrollDto.allowances !== undefined) {
      data.allowances = updatePayrollDto.allowances;
    }
    if (updatePayrollDto.deductions !== undefined) {
      data.deductions = updatePayrollDto.deductions;
    }
    if (updatePayrollDto.netPay !== undefined) {
      data.netPay = updatePayrollDto.netPay;
    }
    if (updatePayrollDto.status !== undefined) {
      data.status = updatePayrollDto.status;
    }
    if (updatePayrollDto.processedAt !== undefined) {
      data.processedAt = updatePayrollDto.processedAt
        ? new Date(updatePayrollDto.processedAt)
        : null;
    }

    return this.prisma.payroll.update({
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

  async deletePayroll(id: string) {
    const payroll = await this.prisma.payroll.findUnique({
      where: { id },
    });

    if (!payroll) {
      throw new NotFoundException(`Payroll record with id ${id} not found`);
    }

    if (payroll.status === 'PAID') {
      throw new ConflictException('Cannot delete a paid payroll record');
    }

    return this.prisma.payroll.delete({ where: { id } });
  }
}
