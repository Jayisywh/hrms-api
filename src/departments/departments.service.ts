import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department-dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}
  async getAllDepartments(search?: string) {
    return this.prisma.department.findMany({
      where: search
        ? {
            OR: [
              {
                code: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {},
    });
  }

  async getDepartmentById(id: string) {
    const department = await this.prisma.department.findUnique({
      where: {
        id: id,
      },
    });

    if (!department) {
      throw new NotFoundException(`Department with id ${id} not found`);
    }

    return department;
  }

  async createDepartment(createDepartmentDto: CreateDepartmentDto) {
    const existingDepartment = await this.prisma.department.findFirst({
      where: {
        OR: [
          {
            code: createDepartmentDto.code,
          },
          {
            name: createDepartmentDto.name,
          },
        ],
      },
    });

    if (existingDepartment) {
      throw new ConflictException('Department name or code already exists');
    }

    const department = await this.prisma.department.create({
      data: createDepartmentDto,
    });
    return department;
  }

  async updateDepartment(id: string, updateDepartmentDto: UpdateDepartmentDto) {
    await this.getDepartmentById(id);

    if (updateDepartmentDto.code) {
      const existingCode = await this.prisma.department.findFirst({
        where: {
          code: updateDepartmentDto.code,
          NOT: {
            id,
          },
        },
      });
      if (existingCode) {
        throw new ConflictException(
          `Department code ${updateDepartmentDto.code} already exists`,
        );
      }
    }

    if (updateDepartmentDto.name) {
      const existingName = await this.prisma.department.findFirst({
        where: {
          name: updateDepartmentDto.name,
          NOT: { id },
        },
      });
      if (existingName) {
        throw new ConflictException(
          `Department name ${updateDepartmentDto.name} already exists`,
        );
      }
    }

    const updatedDepartment = await this.prisma.department.update({
      where: {
        id: id,
      },
      data: updateDepartmentDto,
    });
    return updatedDepartment;
  }

  async deleteDepartment(id: string) {
    const department = await this.prisma.department.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            employees: true,
            positions: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException(`Department with id ${id} not found`);
    }

    if (department._count.employees > 0 || department._count.positions > 0) {
      throw new ConflictException(
        'Department cannot be deleted because employees or positions are assigned to it',
      );
    }
    return this.prisma.department.delete({
      where: {
        id: id,
      },
    });
  }
}
