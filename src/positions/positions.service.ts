import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';

@Injectable()
export class PositionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllPositions(search?: string) {
    const positions = await this.prisma.position.findMany({
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
            ],
          }
        : {},
    });
    return positions;
  }

  async getPositionById(id: string) {
    const position = await this.prisma.position.findUnique({
      where: {
        id: id,
      },
    });

    if (!position) {
      throw new NotFoundException(`Position with ${id} not found`);
    }

    return position;
  }

  async createPosition(createPositionDto: CreatePositionDto) {
    const department = await this.prisma.department.findUnique({
      where: {
        id: createPositionDto.departmentId,
      },
    });
    if (!department) {
      throw new NotFoundException(
        `Department with ${createPositionDto.departmentId} not found`,
      );
    }

    const existingCode = await this.prisma.position.findUnique({
      where: {
        code: createPositionDto.code,
      },
    });

    if (existingCode) {
      throw new ConflictException(
        `Position with ${createPositionDto.code} already exists`,
      );
    }

    const existingName = await this.prisma.position.findFirst({
      where: {
        departmentId: createPositionDto.departmentId,
        name: createPositionDto.name,
      },
    });

    if (existingName) {
      throw new ConflictException(
        `Position ${createPositionDto.name} already exists in this department`,
      );
    }

    const newPosition = await this.prisma.position.create({
      data: createPositionDto,
    });

    return newPosition;
  }

  async updatePosition(id: string, updatePositionDto: UpdatePositionDto) {
    const currentPosition = await this.getPositionById(id);

    if (updatePositionDto.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: {
          id: updatePositionDto.departmentId,
        },
      });

      if (!department) {
        throw new NotFoundException(
          `Department with id ${updatePositionDto.departmentId} not found`,
        );
      }
    }

    const targetDepartmentId =
      updatePositionDto.departmentId ?? currentPosition.departmentId;

    const targetName = updatePositionDto.name ?? currentPosition.name;

    const duplicateName = await this.prisma.position.findFirst({
      where: {
        departmentId: targetDepartmentId,
        name: targetName,
        NOT: {
          id,
        },
      },
    });

    if (duplicateName) {
      throw new ConflictException(
        `Position ${targetName} already exists in this department`,
      );
    }

    if (updatePositionDto.code) {
      const existingCode = await this.prisma.position.findFirst({
        where: {
          code: updatePositionDto.code,
          NOT: {
            id,
          },
        },
      });

      if (existingCode) {
        throw new ConflictException(
          `Position code ${updatePositionDto.code} already exists`,
        );
      }
    }

    return this.prisma.position.update({
      where: {
        id,
      },
      data: updatePositionDto,
    });
  }

  async deletePosition(id: string) {
    const position = await this.prisma.position.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });

    if (!position) {
      throw new NotFoundException(`Position with id ${id} not found`);
    }

    if (position._count.employees > 0) {
      throw new ConflictException(
        'Positions cannot be deleted because employees are assigned to it',
      );
    }
    return await this.prisma.position.delete({
      where: {
        id,
      },
    });
  }
}
