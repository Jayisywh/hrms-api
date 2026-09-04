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
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { PositionsService } from './positions.service';

@Controller('positions')
export class PositionsController {
  constructor(private readonly positionService: PositionsService) {}
  @Get()
  getAll(@Query('search') search?: string) {
    return this.positionService.getAllPositions(search);
  }

  @Get(':id')
  getPositionById(@Param('id') id: string) {
    return this.positionService.getPositionById(id);
  }

  @Post()
  createPosition(@Body() createPositionDto: CreatePositionDto) {
    return this.positionService.createPosition(createPositionDto);
  }

  @Patch(':id')
  updatePosition(
    @Param('id') id: string,
    @Body() updatePositionDto: UpdatePositionDto,
  ) {
    return this.positionService.updatePosition(id, updatePositionDto);
  }

  @Delete(':id')
  deletePosition(@Param('id') id: string) {
    return this.positionService.deletePosition(id);
  }
}
