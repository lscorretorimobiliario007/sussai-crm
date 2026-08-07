import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import type { Request } from 'express';
import { AuditService } from './audit.service';
import type { AuthUser } from '../auth/types/auth-user.type';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request & { user?: AuthUser }>();
    const method = (request.method || '').toUpperCase();

    if (!WRITE_METHODS.has(method) || !request.user) {
      return next.handle();
    }

    const routePathValue =
      request.route &&
      typeof request.route === 'object' &&
      'path' in request.route
        ? (request.route as { path?: unknown }).path
        : undefined;
    const routePath = typeof routePathValue === 'string' ? routePathValue : '';
    const path = routePath
      ? `${request.baseUrl || ''}${routePath}`
      : request.originalUrl || request.url;
    const entity =
      String(path || 'unknown')
        .replace(/^\/api\/?/, '')
        .split('/')
        .filter(Boolean)[0] || 'unknown';
    const entityId =
      (request.params && (request.params.id || request.params.entityId)) ||
      null;
    const resolvedEntityId = Array.isArray(entityId) ? entityId[0] : entityId;

    return next.handle().pipe(
      tap({
        next: () => {
          void this.auditService.logAudit(
            request.user,
            method,
            entity,
            resolvedEntityId,
            {
              path: request.originalUrl || request.url,
              query: request.query,
            },
            request.ip,
          );
        },
      }),
    );
  }
}
