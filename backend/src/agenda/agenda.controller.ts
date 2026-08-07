import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { AgendaService } from './agenda.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { QueryEventoDto } from './dto/query-evento.dto';
import { ReagendarEventoDto } from './dto/reagendar-evento.dto';

@Controller('agenda')
@UseGuards(JwtAuthGuard)
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  @Get('opcoes')
  options(@CurrentUser() user: AuthUser) {
    return this.agendaService.options(user);
  }

  @Get('dashboard')
  dashboard(@CurrentUser() user: AuthUser) {
    return this.agendaService.dashboard(user);
  }

  @Get('timeline')
  timeline(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.agendaService.timeline(
      user,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get('notificacoes')
  notificacoes(@CurrentUser() user: AuthUser) {
    return this.agendaService.notificacoes(user);
  }

  @Patch('notificacoes/lidas')
  markAllRead(@CurrentUser() user: AuthUser) {
    return this.agendaService.markAllNotificationsRead(user);
  }

  @Patch('notificacoes/:id/lida')
  markOneRead(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.agendaService.markNotificationRead(user, id);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryEventoDto) {
    return this.agendaService.findAll(user, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.agendaService.findOne(user, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateEventoDto) {
    return this.agendaService.create(user, dto);
  }

  @Put(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventoDto,
  ) {
    return this.agendaService.update(user, id, dto);
  }

  @Patch(':id/reagendar')
  reagendar(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReagendarEventoDto,
  ) {
    return this.agendaService.reagendar(user, id, dto);
  }

  @Patch(':id/concluir')
  concluir(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.agendaService.concluir(user, id);
  }

  @Patch(':id/cancelar')
  cancelar(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.agendaService.cancelar(user, id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.agendaService.remove(user, id);
  }
}
