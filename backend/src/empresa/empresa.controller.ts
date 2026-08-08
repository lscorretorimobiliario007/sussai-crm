import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
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
import { imageFileFilter } from '../common/upload/file-filters';
import { resolveUploadPath } from '../common/utils/uploads-root';
import { EmpresaService } from './empresa.service';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';

const MAX_LOGO_SIZE = 5 * 1024 * 1024;

const uploadInterceptor = AnyFilesInterceptor({
  storage: diskStorage({
    destination: (req, _file, cb) => {
      const user = (req as typeof req & { user?: AuthUser }).user;
      const dir = resolveUploadPath('empresa', String(user?.empresaId || '0'));
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const rawKind = req.params.kind || file.fieldname || 'asset';
      const kind = Array.isArray(rawKind) ? rawKind[0] : rawKind;
      const ext = extname(file.originalname).toLowerCase() || '.png';
      cb(null, `${String(kind)}-${randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: MAX_LOGO_SIZE, files: 1 },
  fileFilter: imageFileFilter,
});

@Controller('empresa')
@UseGuards(JwtAuthGuard)
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  @Get()
  getCurrent(@CurrentUser() user: AuthUser) {
    return this.empresaService.getCurrent(user.empresaId);
  }

  @Put()
  @UseGuards(RolesGuard)
  @Roles(UserProfile.ADMIN)
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateEmpresaDto) {
    return this.empresaService.update(user, dto);
  }

  @Post('logo')
  @UseGuards(RolesGuard)
  @Roles(UserProfile.ADMIN)
  @UseInterceptors(uploadInterceptor)
  uploadLogo(
    @CurrentUser() user: AuthUser,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const file = files?.[0];
    if (!file) throw new BadRequestException('Arquivo não enviado');
    return this.empresaService.uploadAsset(user, 'logo', file);
  }

  @Post(':kind')
  @UseGuards(RolesGuard)
  @Roles(UserProfile.ADMIN)
  @UseInterceptors(uploadInterceptor)
  uploadKind(
    @CurrentUser() user: AuthUser,
    @Param('kind') kind: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const file = files?.[0];
    if (!file) throw new BadRequestException('Arquivo não enviado');
    return this.empresaService.uploadAsset(user, kind, file);
  }
}
