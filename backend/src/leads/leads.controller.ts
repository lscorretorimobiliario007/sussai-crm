import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { QueryLeadDto } from './dto/query-lead.dto';
import { MoveLeadDto } from './dto/move-lead.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';

@Controller('leads')
@UseGuards(JwtAuthGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() createLeadDto: CreateLeadDto) {
    return this.leadsService.create(user.empresaId, createLeadDto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryLeadDto) {
    return this.leadsService.findAll(user.empresaId, query);
  }

  @Get('dashboard')
  dashboard(@CurrentUser() user: AuthUser) {
    return this.leadsService.dashboard(user.empresaId);
  }

  @Get('opcoes')
  opcoes(@CurrentUser() user: AuthUser) {
    return this.leadsService.opcoes(user);
  }

  @Get('kanban')
  kanban(@CurrentUser() user: AuthUser) {
    return this.leadsService.kanban(user.empresaId);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.leadsService.findOne(user.empresaId, id);
  }

  @Patch(':id/move')
  move(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MoveLeadDto,
  ) {
    return this.leadsService.move(user.empresaId, user.id, id, dto);
  }

  @Patch(':id/mover')
  mover(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MoveLeadDto,
  ) {
    return this.leadsService.move(user.empresaId, user.id, id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLeadDto: UpdateLeadDto,
  ) {
    return this.leadsService.update(user.empresaId, id, updateLeadDto);
  }

  @Put(':id')
  replace(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLeadDto: UpdateLeadDto,
  ) {
    return this.leadsService.update(user.empresaId, id, updateLeadDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.leadsService.remove(user.empresaId, id);
  }
}
