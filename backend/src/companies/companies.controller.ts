import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserProfile } from '@prisma/client';
import { CompaniesService } from './companies.service';
import { UpdateCompanyDto } from './dto/create-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';

@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserProfile.ADMIN)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  create() {
    throw new ForbiddenException(
      'Criação de empresa não permitida neste endpoint. Use o fluxo de registro.',
    );
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.companiesService.findAllForTenant(user.empresaId);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    this.assertOwnCompany(user, id);
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    this.assertOwnCompany(user, id);
    return this.companiesService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  remove() {
    throw new ForbiddenException(
      'Exclusão de empresa não permitida neste endpoint.',
    );
  }

  private assertOwnCompany(user: AuthUser, id: number) {
    if (id !== user.empresaId) {
      throw new ForbiddenException('Acesso negado a empresa de outro tenant');
    }
  }
}
