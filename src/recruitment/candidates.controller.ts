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
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { CandidatesService } from './candidates.service';

@Controller('recruitment/candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.candidatesService.getAllCandidates(search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.candidatesService.getCandidateById(id);
  }

  @Post()
  create(@Body() createCandidateDto: CreateCandidateDto) {
    return this.candidatesService.createCandidate(createCandidateDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCandidateDto: UpdateCandidateDto,
  ) {
    return this.candidatesService.updateCandidate(id, updateCandidateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.candidatesService.deleteCandidate(id);
  }
}
