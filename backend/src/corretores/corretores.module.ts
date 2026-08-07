import { Module } from '@nestjs/common';
import { CorretoresController } from './corretores.controller';
import { CorretoresService } from './corretores.service';

@Module({
  controllers: [CorretoresController],
  providers: [CorretoresService],
  exports: [CorretoresService],
})
export class CorretoresModule {}
