import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllApplications(search?: string) {
    return this.prisma.application.findMany({
      where: search
        ? {
            OR: [
              {
                candidate: {
                  firstName: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                candidate: {
                  lastName: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                candidate: {
                  email: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                jobPosting: {
                  title: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              },
            ],
          }
        : {},
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        jobPosting: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getApplicationById(id: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            resumeUrl: true,
          },
        },
        jobPosting: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException(`Application with id ${id} not found`);
    }

    return application;
  }

  async createApplication(createApplicationDto: CreateApplicationDto) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: createApplicationDto.candidateId },
    });

    if (!candidate) {
      throw new NotFoundException(
        `Candidate with id ${createApplicationDto.candidateId} not found`,
      );
    }

    const jobPosting = await this.prisma.jobPosting.findUnique({
      where: { id: createApplicationDto.jobPostingId },
    });

    if (!jobPosting) {
      throw new NotFoundException(
        `Job posting with id ${createApplicationDto.jobPostingId} not found`,
      );
    }

    if (jobPosting.status !== 'OPEN') {
      throw new ConflictException('Job posting is not open for applications');
    }

    const existing = await this.prisma.application.findFirst({
      where: {
        candidateId: createApplicationDto.candidateId,
        jobPostingId: createApplicationDto.jobPostingId,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Candidate has already applied to this job posting',
      );
    }

    return this.prisma.application.create({
      data: {
        candidateId: createApplicationDto.candidateId,
        jobPostingId: createApplicationDto.jobPostingId,
        status: createApplicationDto.status,
      },
      include: {
        candidate: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        jobPosting: {
          select: { id: true, title: true, status: true },
        },
      },
    });
  }

  async updateApplication(
    id: string,
    updateApplicationDto: UpdateApplicationDto,
  ) {
    await this.getApplicationById(id);

    const data: Record<string, unknown> = {};
    if (updateApplicationDto.candidateId !== undefined) {
      data.candidateId = updateApplicationDto.candidateId;
    }
    if (updateApplicationDto.jobPostingId !== undefined) {
      data.jobPostingId = updateApplicationDto.jobPostingId;
    }
    if (updateApplicationDto.status !== undefined) {
      data.status = updateApplicationDto.status;
    }

    return this.prisma.application.update({
      where: { id },
      data,
      include: {
        candidate: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        jobPosting: {
          select: { id: true, title: true, status: true },
        },
      },
    });
  }

  async deleteApplication(id: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
    });

    if (!application) {
      throw new NotFoundException(`Application with id ${id} not found`);
    }

    return this.prisma.application.delete({ where: { id } });
  }
}
