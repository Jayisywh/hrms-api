import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateJobPostingDto } from './dto/create-job-posting.dto';
import { UpdateJobPostingDto } from './dto/update-job-posting.dto';
import { JobPostingsService } from './job-postings.service';

@Controller('recruitment/job-postings')
export class JobPostingsController {
  constructor(private readonly jobPostingsService: JobPostingsService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.jobPostingsService.getAllJobPostings(search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobPostingsService.getJobPostingById(id);
  }

  @Post()
  create(@Body() createJobPostingDto: CreateJobPostingDto) {
    return this.jobPostingsService.createJobPosting(createJobPostingDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateJobPostingDto: UpdateJobPostingDto,
  ) {
    return this.jobPostingsService.updateJobPosting(id, updateJobPostingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.jobPostingsService.deleteJobPosting(id);
  }
}
