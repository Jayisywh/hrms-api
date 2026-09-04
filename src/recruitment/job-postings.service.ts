import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateJobPostingDto } from './dto/create-job-posting.dto';
import { UpdateJobPostingDto } from './dto/update-job-posting.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class JobPostingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllJobPostings(search?: string) {
    return this.prisma.jobPosting.findMany({
      where: search
        ? {
            OR: [
              {
                title: {
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
              {
                department: {
                  name: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              },
            ],
          }
        : {},
      include: {
        department: {
          select: { id: true, code: true, name: true },
        },
        position: {
          select: { id: true, code: true, name: true },
        },
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getJobPostingById(id: string) {
    const jobPosting = await this.prisma.jobPosting.findUnique({
      where: { id },
      include: {
        department: {
          select: { id: true, code: true, name: true },
        },
        position: {
          select: { id: true, code: true, name: true },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!jobPosting) {
      throw new NotFoundException(`Job posting with id ${id} not found`);
    }

    return jobPosting;
  }

  async createJobPosting(createJobPostingDto: CreateJobPostingDto) {
    const department = await this.prisma.department.findUnique({
      where: { id: createJobPostingDto.departmentId },
    });

    if (!department) {
      throw new NotFoundException(
        `Department with id ${createJobPostingDto.departmentId} not found`,
      );
    }

    if (createJobPostingDto.positionId) {
      const position = await this.prisma.position.findUnique({
        where: { id: createJobPostingDto.positionId },
      });

      if (!position) {
        throw new NotFoundException(
          `Position with id ${createJobPostingDto.positionId} not found`,
        );
      }
    }

    return this.prisma.jobPosting.create({
      data: {
        title: createJobPostingDto.title,
        description: createJobPostingDto.description,
        departmentId: createJobPostingDto.departmentId,
        positionId: createJobPostingDto.positionId,
        status: createJobPostingDto.status,
      },
      include: {
        department: {
          select: { id: true, code: true, name: true },
        },
        position: {
          select: { id: true, code: true, name: true },
        },
      },
    });
  }

  async updateJobPosting(id: string, updateJobPostingDto: UpdateJobPostingDto) {
    await this.getJobPostingById(id);

    const data: Record<string, unknown> = {};
    if (updateJobPostingDto.title !== undefined) {
      data.title = updateJobPostingDto.title;
    }
    if (updateJobPostingDto.description !== undefined) {
      data.description = updateJobPostingDto.description;
    }
    if (updateJobPostingDto.departmentId !== undefined) {
      data.departmentId = updateJobPostingDto.departmentId;
    }
    if (updateJobPostingDto.positionId !== undefined) {
      data.positionId = updateJobPostingDto.positionId;
    }
    if (updateJobPostingDto.status !== undefined) {
      data.status = updateJobPostingDto.status;
      if (
        updateJobPostingDto.status === 'CLOSED' ||
        updateJobPostingDto.status === 'FILLED'
      ) {
        data.closedAt = new Date();
      }
    }

    return this.prisma.jobPosting.update({
      where: { id },
      data,
      include: {
        department: {
          select: { id: true, code: true, name: true },
        },
        position: {
          select: { id: true, code: true, name: true },
        },
      },
    });
  }

  async deleteJobPosting(id: string) {
    const jobPosting = await this.prisma.jobPosting.findUnique({
      where: { id },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!jobPosting) {
      throw new NotFoundException(`Job posting with id ${id} not found`);
    }

    if (jobPosting._count.applications > 0) {
      throw new ConflictException(
        'Cannot delete job posting with existing applications',
      );
    }

    return this.prisma.jobPosting.delete({ where: { id } });
  }
}
