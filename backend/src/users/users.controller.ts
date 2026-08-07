import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { UserProfile } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserProfile.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.usersService.create(user, createUserDto);
  }
}
