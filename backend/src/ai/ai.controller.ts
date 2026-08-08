import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserProfile } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AiService } from './ai.service';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserProfile.ADMIN, UserProfile.GERENTE, UserProfile.CORRETOR)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('status')
  status() {
    return this.aiService.status;
  }

  @Post('leads/classify')
  classifyLead(@Body() body: Record<string, unknown>) {
    return this.aiService.classifyLead(body || {});
  }

  @Post('leads/score')
  scoreLead(@Body() body: Record<string, unknown>) {
    return this.aiService.scoreLead(body || {});
  }

  @Post('properties/suggest')
  suggestProperties(@Body() body: Record<string, unknown>) {
    return this.aiService.suggestProperties(body || {});
  }

  @Post('clientes/summarize')
  summarizeCliente(@Body() body: Record<string, unknown>) {
    return this.aiService.summarizeCliente(body || {});
  }

  @Post('proprietarios/summarize')
  summarizeProprietario(@Body() body: Record<string, unknown>) {
    return this.aiService.summarizeProprietario(body || {});
  }

  @Post('assistant')
  assistCorretor(
    @Body() body: { pergunta?: string; contexto?: Record<string, unknown> },
  ) {
    return this.aiService.assistCorretor({
      pergunta: String(body?.pergunta || '').trim() || 'Como posso ajudar?',
      contexto: body?.contexto,
    });
  }
}
