import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePositionDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  @IsNotEmpty()
  departmentId!: string;
}
