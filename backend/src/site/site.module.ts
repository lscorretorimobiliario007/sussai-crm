import { Module } from '@nestjs/common';
import { SiteController } from './site.controller';
import { SiteService } from './site.service';
import { PipelineModule } from '../pipeline/pipeline.module';
import { RateLimitGuard } from '../common/middleware/rate-limit';

@Module({
  imports: [PipelineModule],
  controllers: [SiteController],
  providers: [SiteService, RateLimitGuard],
  exports: [SiteService],
})
export class SiteModule {}
