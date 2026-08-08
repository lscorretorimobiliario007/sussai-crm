import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { RuleBasedAiProvider } from './providers/rule-based.ai-provider';

@Module({
  controllers: [AiController],
  providers: [RuleBasedAiProvider, AiService],
  exports: [AiService],
})
export class AiModule {}
