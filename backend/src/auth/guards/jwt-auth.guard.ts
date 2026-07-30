import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser>(
    err: Error | null,
    user: TUser,
    info?: { message?: string } | string,
  ): TUser {
    if (err || !user) {
      const infoMessage =
        typeof info === 'string' ? info : info?.message;

      throw (
        err
        || new UnauthorizedException(
          infoMessage === 'No auth token'
            ? 'Token de autenticação não informado'
            : 'Token inválido ou expirado',
        )
      );
    }

    return user;
  }
}
