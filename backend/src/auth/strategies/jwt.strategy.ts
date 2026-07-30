import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import type { AuthUser, JwtPayload } from '../types/auth-user.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly authService: AuthService) {
    const secret = process.env.JWT_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET é obrigatório em produção');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret || 'SUSSAI_SUPER_SECRET_2026',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (!payload?.id || !payload?.empresaId || !payload?.email || !payload?.perfil) {
      throw new UnauthorizedException('Token JWT inválido');
    }

    return this.authService.validateUserById(payload.id);
  }
}
