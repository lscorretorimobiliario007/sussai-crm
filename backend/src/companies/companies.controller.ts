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
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @Roles(UserProfile.ADMIN)
  create() {
    // Tenant admins must not invent new companies via this API (use /auth/registrar).
    throw new ForbiddenException(
      'Criação de empresas via API desabilitada. Use o cadastro público ou suporte.',
    );
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.companiesService.findAllForUser(user);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.companiesService.findOneForUser(user, id);
  }

  @Patch(':id')
  @Roles(UserProfile.ADMIN)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return this.companiesService.updateForUser(user, id, updateCompanyDto);
  }

  @Delete(':id')
  @Roles(UserProfile.ADMIN)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.companiesService.removeForUser(user, id);
  }
}
