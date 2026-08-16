import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from 'src/generated/prisma/enums';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return users;
  }

  async findOneUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  }

  async createUser(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  }

  async updateUser(
    requester: {
      id: string;
      role: Role;
    },
    id: string,
    updateUserDto: UpdateUserDto,
  ) {
    const targetUser = await this.findOneUser(id);
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    if (requester.role === Role.HR && targetUser.role === Role.ADMIN) {
      throw new ForbiddenException('HR cannnot modify an admin account');
    }

    if (requester.role === Role.HR && updateUserDto.role === Role.ADMIN) {
      throw new ForbiddenException('HR cannot assign the Admin role');
    }

    const dataToUpdate: Record<string, any> = {};
    if (updateUserDto.email) {
      dataToUpdate.email = updateUserDto.email;
    }

    if (updateUserDto.password) {
      dataToUpdate.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    if (updateUserDto.role) {
      dataToUpdate.role = updateUserDto.role;
    }

    return this.prisma.user.update({
      where: {
        id: id,
      },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deleteUser(id: string) {
    const isUserExist = await this.findOneUser(id);
    if (!isUserExist) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.delete({
      where: {
        id: id,
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmailForAuth(email: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: email,
      },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
