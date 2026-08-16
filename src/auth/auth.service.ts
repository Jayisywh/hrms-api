import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import { UsersService } from 'src/users/users.service';
import bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.userService.findByEmailForAuth(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    return {
      accessToken,
    };
  }
}
