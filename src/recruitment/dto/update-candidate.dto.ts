import { CreateCandidateDto } from './create-candidate.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateCandidateDto extends PartialType(CreateCandidateDto) {}
