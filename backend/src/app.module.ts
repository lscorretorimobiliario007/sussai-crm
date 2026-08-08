import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { CompaniesModule } from './companies/companies.module';
import { PropertiesModule } from './properties/properties.module';
import { UploadsModule } from './uploads/uploads.module';
import { SiteModule } from './site/site.module';
import { LeadsModule } from './leads/leads.module';
import { PipelineModule } from './pipeline/pipeline.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PropertyOwnersModule } from './property-owners/property-owners.module';
import { CorretoresModule } from './corretores/corretores.module';
import { EmpresaModule } from './empresa/empresa.module';
import { SearchModule } from './search/search.module';
import { NotificacoesModule } from './notificacoes/notificacoes.module';
import { AuditModule } from './audit/audit.module';
import { AdminModule } from './admin/admin.module';
import { LogsModule } from './logs/logs.module';
import { IntegracoesModule } from './integracoes/integracoes.module';
import { BackupModule } from './backup/backup.module';
import { DocumentosModule } from './documentos/documentos.module';
import { ClientesModule } from './clientes/clientes.module';
import { AgendaModule } from './agenda/agenda.module';
import { ContratosModule } from './contratos/contratos.module';
import { TarefasModule } from './tarefas/tarefas.module';
import { FinanceiroModule } from './financeiro/financeiro.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    PrismaModule,
    AuditModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    EmpresaModule,
    PropertiesModule,
    UploadsModule,
    SiteModule,
    LeadsModule,
    PipelineModule,
    DashboardModule,
    PropertyOwnersModule,
    ClientesModule,
    AgendaModule,
    ContratosModule,
    TarefasModule,
    FinanceiroModule,
    CorretoresModule,
    SearchModule,
    NotificacoesModule,
    AdminModule,
    LogsModule,
    IntegracoesModule,
    BackupModule,
    DocumentosModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
