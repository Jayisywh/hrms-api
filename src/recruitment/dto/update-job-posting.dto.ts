import { CreateJobPostingDto } from './create-job-posting.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateJobPostingDto extends PartialType(CreateJobPostingDto) {}
