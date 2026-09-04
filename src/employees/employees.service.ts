import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllEmployees(search?: string) {
    return this.prisma.employee.findMany({
      where: search
        ? {
            OR: [
              {
                employeeCode: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                firstName: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                lastName: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {},
      include: {
        department: true,
        position: true,
        manager: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  async getEmployeeById(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        position: true,
        manager: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
          },
        },
        subordinates: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with id ${id} not found`);
    }

    return employee;
  }

  async createEmployee(createEmployeeDto: CreateEmployeeDto) {
    await this.validateDepartment(createEmployeeDto.departmentId);
    await this.validatePosition(
      createEmployeeDto.positionId,
      createEmployeeDto.departmentId,
    );

    if (createEmployeeDto.managerId) {
      await this.validateManager(createEmployeeDto.managerId);
    }

    if (createEmployeeDto.userId) {
      await this.validateUser(createEmployeeDto.userId);
    }

    const employeeCode =
      createEmployeeDto.employeeCode ?? (await this.generateEmployeeCode());

    if (createEmployeeDto.employeeCode) {
      const existingCode = await this.prisma.employee.findUnique({
        where: { employeeCode: createEmployeeDto.employeeCode },
      });
      if (existingCode) {
        throw new ConflictException(
          `Employee code ${createEmployeeDto.employeeCode} already exists`,
        );
      }
    }

    return this.prisma.employee.create({
      data: {
        employeeCode,
        firstName: createEmployeeDto.firstName,
        lastName: createEmployeeDto.lastName,
        phone: createEmployeeDto.phone,
        address: createEmployeeDto.address,
        dateOfBirth: createEmployeeDto.dateOfBirth
          ? new Date(createEmployeeDto.dateOfBirth)
          : undefined,
        hireDate: new Date(createEmployeeDto.hireDate),
        employmentType: createEmployeeDto.employmentType,
        status: createEmployeeDto.status,
        userId: createEmployeeDto.userId,
        departmentId: createEmployeeDto.departmentId,
        positionId: createEmployeeDto.positionId,
        managerId: createEmployeeDto.managerId,
      },
    });
  }

  async updateEmployee(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    const currentEmployee = await this.getEmployeeById(id);

    if (updateEmployeeDto.departmentId) {
      await this.validateDepartment(updateEmployeeDto.departmentId);
    }

    const targetDepartmentId =
      updateEmployeeDto.departmentId ?? currentEmployee.departmentId;

    if (updateEmployeeDto.positionId) {
      await this.validatePosition(
        updateEmployeeDto.positionId,
        targetDepartmentId,
      );
    } else if (targetDepartmentId !== currentEmployee.departmentId) {
      const position = await this.prisma.position.findUnique({
        where: { id: currentEmployee.positionId },
      });
      if (position && position.departmentId !== targetDepartmentId) {
        throw new ConflictException(
          'Position does not belong to the selected department, provide a new positionId',
        );
      }
    }

    if (updateEmployeeDto.managerId) {
      await this.validateManager(updateEmployeeDto.managerId);
    }

    if (updateEmployeeDto.userId) {
      const linked = await this.prisma.employee.findFirst({
        where: {
          userId: updateEmployeeDto.userId,
          NOT: { id },
        },
      });
      if (linked) {
        throw new ConflictException(
          'User is already linked to another employee',
        );
      }
    }

    if (updateEmployeeDto.employeeCode) {
      const existingCode = await this.prisma.employee.findFirst({
        where: {
          employeeCode: updateEmployeeDto.employeeCode,
          NOT: { id },
        },
      });
      if (existingCode) {
        throw new ConflictException(
          `Employee code ${updateEmployeeDto.employeeCode} already exists`,
        );
      }
    }

    const data: Record<string, any> = {};
    if (updateEmployeeDto.employeeCode) {
      data.employeeCode = updateEmployeeDto.employeeCode;
    }
    if (updateEmployeeDto.firstName) {
      data.firstName = updateEmployeeDto.firstName;
    }
    if (updateEmployeeDto.lastName) {
      data.lastName = updateEmployeeDto.lastName;
    }
    if (updateEmployeeDto.phone !== undefined) {
      data.phone = updateEmployeeDto.phone;
    }
    if (updateEmployeeDto.address !== undefined) {
      data.address = updateEmployeeDto.address;
    }
    if (updateEmployeeDto.dateOfBirth) {
      data.dateOfBirth = new Date(updateEmployeeDto.dateOfBirth);
    }
    if (updateEmployeeDto.hireDate) {
      data.hireDate = new Date(updateEmployeeDto.hireDate);
    }
    if (updateEmployeeDto.employmentType) {
      data.employmentType = updateEmployeeDto.employmentType;
    }
    if (updateEmployeeDto.status) {
      data.status = updateEmployeeDto.status;
    }
    if (updateEmployeeDto.userId !== undefined) {
      data.userId = updateEmployeeDto.userId;
    }
    if (updateEmployeeDto.departmentId) {
      data.departmentId = updateEmployeeDto.departmentId;
    }
    if (updateEmployeeDto.positionId) {
      data.positionId = updateEmployeeDto.positionId;
    }
    if (updateEmployeeDto.managerId !== undefined) {
      data.managerId = updateEmployeeDto.managerId;
    }

    return this.prisma.employee.update({
      where: { id },
      data,
    });
  }

  async deleteEmployee(id: string) {
    await this.getEmployeeById(id);
    return this.prisma.employee.delete({ where: { id } });
  }

  private async generateEmployeeCode(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
      const count = await this.prisma.employee.count();
      const code = `EMP-${String(count + 1).padStart(6, '0')}`;
      const existing = await this.prisma.employee.findUnique({
        where: { employeeCode: code },
      });
      if (!existing) {
        return code;
      }
    }
    throw new ConflictException('Unable to generate a unique employee code');
  }

  private async validateDepartment(departmentId: string) {
    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
    });
    if (!department) {
      throw new NotFoundException(
        `Department with id ${departmentId} not found`,
      );
    }
    return department;
  }

  private async validatePosition(positionId: string, departmentId: string) {
    const position = await this.prisma.position.findUnique({
      where: { id: positionId },
    });
    if (!position) {
      throw new NotFoundException(`Position with id ${positionId} not found`);
    }
    if (position.departmentId !== departmentId) {
      throw new ConflictException(
        'Position does not belong to the selected department',
      );
    }
    return position;
  }

  private async validateManager(managerId: string) {
    const manager = await this.prisma.employee.findUnique({
      where: { id: managerId },
    });
    if (!manager) {
      throw new NotFoundException(`Manager with id ${managerId} not found`);
    }
    return manager;
  }

  private async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
    const linked = await this.prisma.employee.findUnique({
      where: { userId },
    });
    if (linked) {
      throw new ConflictException('User is already linked to an employee');
    }
    return user;
  }
}
