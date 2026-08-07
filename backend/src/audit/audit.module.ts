import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditInterceptor } from './audit.interceptor';
import { RolesGuard } from '../auth/guards/roles.guard';

@Global()
@Module({
  controllers: [AuditController],
  providers: [
    AuditService,
    RolesGuard,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  exports: [AuditService, RolesGuard],
})
export class AuditModule {}
