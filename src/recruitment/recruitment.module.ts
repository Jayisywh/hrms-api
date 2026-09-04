import { Module } from '@nestjs/common';
import { JobPostingsController } from './job-postings.controller';
import { JobPostingsService } from './job-postings.service';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    JobPostingsController,
    CandidatesController,
    ApplicationsController,
  ],
  providers: [JobPostingsService, CandidatesService, ApplicationsService],
})
export class RecruitmentModule {}
