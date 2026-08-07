import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserProfile } from '@prisma/client';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegistrarDto } from './dto/registrar.dto';
import { CreateAuthUserDto } from './dto/create-auth-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthUser } from './types/auth-user.type';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { RateLimit, RateLimitGuard } from '../common/middleware/rate-limit';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  @RateLimit({ windowMs: 15 * 60 * 1000, max: 20, keyPrefix: 'auth-login' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.senha);
  }

  @Post('registrar')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RateLimitGuard)
  @RateLimit({ windowMs: 60 * 60 * 1000, max: 10, keyPrefix: 'auth-registrar' })
  registrar(@Body() dto: RegistrarDto) {
    return this.authService.registrar(dto);
  }

  @Post('demo')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  @RateLimit({ windowMs: 15 * 60 * 1000, max: 15, keyPrefix: 'auth-demo' })
  entrarDemo(@Body() body: { reset?: boolean }) {
    return this.authService.entrarDemo({ reset: body?.reset === true });
  }

  @Post('demo/reset')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  @RateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    keyPrefix: 'auth-demo-reset',
  })
  resetDemo() {
    return this.authService.entrarDemo({ reset: true });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user.id);
  }

  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  perfil(@CurrentUser() user: AuthUser) {
    return this.authService.me(user.id);
  }

  @Get('usuarios')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserProfile.ADMIN, UserProfile.GERENTE)
  listUsuarios(@CurrentUser() user: AuthUser) {
    return this.authService.listUsuarios(user);
  }

  @Post('usuarios')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserProfile.ADMIN)
  createUsuario(@CurrentUser() user: AuthUser, @Body() dto: CreateAuthUserDto) {
    return this.authService.createUsuario(user, dto);
  }
}
