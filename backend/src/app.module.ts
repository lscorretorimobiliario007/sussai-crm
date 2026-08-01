import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    AuthModule,
    UsersModule,
    PrismaModule,
    CompaniesModule,
    PropertiesModule,
    UploadsModule,
    SiteModule,
    LeadsModule,
    PipelineModule,
    DashboardModule,
    PropertyOwnersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}