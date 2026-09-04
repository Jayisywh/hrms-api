import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { JobStatus } from '../../generated/prisma/enums';

export class CreateJobPostingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsUUID()
  @IsNotEmpty()
  departmentId!: string;

  @IsOptional()
  @IsUUID()
  positionId?: string;

  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;
}
