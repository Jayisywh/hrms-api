import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CandidatesService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllCandidates(search?: string) {
    return this.prisma.candidate.findMany({
      where: search
        ? {
            OR: [
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
              {
                email: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                source: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {},
      include: {
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCandidateById(id: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
      include: {
        applications: {
          include: {
            jobPosting: {
              select: { id: true, title: true, status: true },
            },
          },
        },
      },
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with id ${id} not found`);
    }

    return candidate;
  }

  async createCandidate(createCandidateDto: CreateCandidateDto) {
    const existing = await this.prisma.candidate.findUnique({
      where: { email: createCandidateDto.email },
    });

    if (existing) {
      throw new ConflictException(
        `Candidate with email ${createCandidateDto.email} already exists`,
      );
    }

    return this.prisma.candidate.create({
      data: createCandidateDto,
    });
  }

  async updateCandidate(id: string, updateCandidateDto: UpdateCandidateDto) {
    await this.getCandidateById(id);

    if (updateCandidateDto.email) {
      const existing = await this.prisma.candidate.findFirst({
        where: {
          email: updateCandidateDto.email,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Candidate with email ${updateCandidateDto.email} already exists`,
        );
      }
    }

    const data: Record<string, unknown> = {};
    if (updateCandidateDto.firstName !== undefined) {
      data.firstName = updateCandidateDto.firstName;
    }
    if (updateCandidateDto.lastName !== undefined) {
      data.lastName = updateCandidateDto.lastName;
    }
    if (updateCandidateDto.email !== undefined) {
      data.email = updateCandidateDto.email;
    }
    if (updateCandidateDto.phone !== undefined) {
      data.phone = updateCandidateDto.phone;
    }
    if (updateCandidateDto.resumeUrl !== undefined) {
      data.resumeUrl = updateCandidateDto.resumeUrl;
    }
    if (updateCandidateDto.source !== undefined) {
      data.source = updateCandidateDto.source;
    }

    return this.prisma.candidate.update({
      where: { id },
      data,
    });
  }

  async deleteCandidate(id: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with id ${id} not found`);
    }

    if (candidate._count.applications > 0) {
      throw new ConflictException(
        'Cannot delete candidate with existing applications',
      );
    }

    return this.prisma.candidate.delete({ where: { id } });
  }
}
