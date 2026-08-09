import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllUsers() {
    const users = await this.prisma.user.findMany();
    return users;
  }

  async findOneUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: id,
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
    });
    return user;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    const isUserExist = await this.findOneUser(id);
    if (!isUserExist) {
      throw new NotFoundException('User not found');
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
}
