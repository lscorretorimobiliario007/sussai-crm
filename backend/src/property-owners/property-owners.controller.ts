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
import { CreatePropertyOwnerDto } from './dto/create-property-owner.dto';
import { QueryPropertyOwnerDto } from './dto/query-property-owner.dto';
import { UpdatePropertyOwnerDto } from './dto/update-property-owner.dto';
import { PropertyOwnersService } from './property-owners.service';

@Controller('proprietarios')
@UseGuards(JwtAuthGuard)
export class PropertyOwnersController {
  constructor(private readonly propertyOwnersService: PropertyOwnersService) {}

  @Get('opcoes')
  options(@CurrentUser() user: AuthUser, @Query('busca') search?: string) {
    return this.propertyOwnersService.options(user.empresaId, search);
  }

  @Get('dashboard')
  dashboard(@CurrentUser() user: AuthUser) {
    return this.propertyOwnersService.dashboard(user.empresaId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePropertyOwnerDto) {
    return this.propertyOwnersService.create(user.empresaId, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query() query: QueryPropertyOwnerDto,
  ) {
    return this.propertyOwnersService.findAll(user.empresaId, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.propertyOwnersService.findOne(user.empresaId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePropertyOwnerDto,
  ) {
    return this.propertyOwnersService.update(user.empresaId, id, dto);
  }

  @Put(':id')
  replace(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePropertyOwnerDto,
  ) {
    return this.propertyOwnersService.update(user.empresaId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.propertyOwnersService.remove(user.empresaId, id);
  }

  @Post(':id/reativar')
  reactivate(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.propertyOwnersService.reactivate(user.empresaId, id);
  }
}
