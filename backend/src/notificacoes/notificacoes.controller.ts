import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { NotificacoesService } from './notificacoes.service';

@Controller('notificacoes')
@UseGuards(JwtAuthGuard)
export class NotificacoesController {
  constructor(private readonly notificacoesService: NotificacoesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.notificacoesService.findAll(user);
  }

  @Patch('lidas')
  markAllRead(@CurrentUser() user: AuthUser) {
    return this.notificacoesService.markAllRead(user);
  }

  @Patch(':id/lida')
  markRead(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificacoesService.markRead(user, id);
  }
}
