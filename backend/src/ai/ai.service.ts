import { Injectable } from '@nestjs/common';
import { RuleBasedAiProvider } from './providers/rule-based.ai-provider';
import type {
  AiProvider,
  AssistantReply,
  EntitySummary,
  LeadClassification,
  LeadScore,
  PropertySuggestion,
} from './ai.types';

export const AI_PROVIDER = Symbol('AI_PROVIDER');

@Injectable()
export class AiService {
  constructor(private readonly provider: RuleBasedAiProvider) {}

  get status() {
    const enabled = process.env.AI_ENABLED === 'true';
    return {
      enabled,
      provider: this.provider.name,
      ready: true,
      capabilities: [
        'classifyLead',
        'scoreLead',
        'suggestProperties',
        'summarizeCliente',
        'summarizeProprietario',
        'assistCorretor',
      ],
      note: enabled
        ? 'AI_ENABLED=true — provider ativo (rule-based até configurar LLM externo)'
        : 'AI_ENABLED=false — endpoints retornam heurísticas locais seguras',
    };
  }

  private get active(): AiProvider {
    return this.provider;
  }

  classifyLead(input: Record<string, unknown>): Promise<LeadClassification> {
    return this.active.classifyLead(input);
  }

  scoreLead(input: Record<string, unknown>): Promise<LeadScore> {
    return this.active.scoreLead(input);
  }

  suggestProperties(
    input: Record<string, unknown>,
  ): Promise<PropertySuggestion[]> {
    return this.active.suggestProperties(input);
  }

  summarizeCliente(input: Record<string, unknown>): Promise<EntitySummary> {
    return this.active.summarizeCliente(input);
  }

  summarizeProprietario(
    input: Record<string, unknown>,
  ): Promise<EntitySummary> {
    return this.active.summarizeProprietario(input);
  }

  assistCorretor(input: {
    pergunta: string;
    contexto?: Record<string, unknown>;
  }): Promise<AssistantReply> {
    return this.active.assistCorretor(input);
  }
}
