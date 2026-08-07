import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserProfile } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { IntegracoesService } from './integracoes.service';
import { CreateIntegracaoDto } from './dto/create-integracao.dto';

@Controller('integracoes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserProfile.ADMIN)
export class IntegracoesController {
  constructor(private readonly integracoesService: IntegracoesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.integracoesService.findAll(user.empresaId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateIntegracaoDto) {
    return this.integracoesService.upsert(user, dto);
  }
}
