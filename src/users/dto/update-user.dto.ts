import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from 'src/generated/prisma/enums';

export class UpdateUserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
