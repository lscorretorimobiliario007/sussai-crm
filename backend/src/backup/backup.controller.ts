import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserProfile } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BackupService } from './backup.service';

@Controller('backup')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserProfile.ADMIN)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.backupService.findAll(user.empresaId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser) {
    return this.backupService.createStub(user);
  }
}
