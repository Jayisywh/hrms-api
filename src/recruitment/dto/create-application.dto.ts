import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApplicationStatus } from '../../generated/prisma/enums';

export class CreateApplicationDto {
  @IsUUID()
  @IsNotEmpty()
  candidateId!: string;

  @IsUUID()
  @IsNotEmpty()
  jobPostingId!: string;

  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;
}
