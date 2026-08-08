import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { UserProfile } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { resolveUploadPath } from '../common/utils/uploads-root';
import { CorretoresService } from './corretores.service';
import { QueryCorretorDto } from './dto/query-corretor.dto';
import { CreateCorretorDto } from './dto/create-corretor.dto';
import { UpdateCorretorDto } from './dto/update-corretor.dto';
import { CreateEquipeDto } from './dto/create-equipe.dto';

@Controller('corretores')
@UseGuards(JwtAuthGuard)
export class CorretoresController {
  constructor(private readonly corretoresService: CorretoresService) {}

  @Get('opcoes')
  opcoes(@CurrentUser() user: AuthUser) {
    return this.corretoresService.opcoes(user.empresaId);
  }

  @Get('dashboard')
  dashboard(@CurrentUser() user: AuthUser) {
    return this.corretoresService.dashboard(user);
  }

  @Get('ranking')
  ranking(@CurrentUser() user: AuthUser) {
    return this.corretoresService.ranking(user);
  }

  @Post('equipes')
  @UseGuards(RolesGuard)
  @Roles(UserProfile.ADMIN, UserProfile.GERENTE)
  createEquipe(@CurrentUser() user: AuthUser, @Body() dto: CreateEquipeDto) {
    return this.corretoresService.createEquipe(user, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryCorretorDto) {
    return this.corretoresService.findAll(user, query);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserProfile.ADMIN, UserProfile.GERENTE)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCorretorDto) {
    return this.corretoresService.create(user, dto);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.corretoresService.findOne(user, id);
  }

  @Put(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCorretorDto,
  ) {
    return this.corretoresService.update(user, id, dto);
  }

  @Post(':id/foto')
  @UseInterceptors(
    FileInterceptor('foto', {
      storage: diskStorage({
        destination: (req, _file, cb) => {
          const user = (req as typeof req & { user?: AuthUser }).user;
          const id = req.params.id;
          const dir = resolveUploadPath(
            'corretores',
            String(user?.empresaId || '0'),
            String(id),
          );
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase() || '.jpg';
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    }),
  )
  uploadFoto(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.corretoresService.uploadFoto(user, id, file);
  }
}
