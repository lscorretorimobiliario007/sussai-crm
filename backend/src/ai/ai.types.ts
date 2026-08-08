/**
 * AI provider contract — swap RuleBasedAiProvider for OpenAI/Anthropic later
 * without changing controllers or CRM modules.
 */
export type LeadClassification = {
  categoria: 'quente' | 'morno' | 'frio' | 'captacao' | 'visita' | 'contato';
  confianca: number;
  motivos: string[];
};

export type LeadScore = {
  score: number;
  faixa: 'A' | 'B' | 'C' | 'D';
  fatores: Array<{ nome: string; peso: number; detalhe: string }>;
};

export type PropertySuggestion = {
  propertyId: number;
  titulo: string;
  score: number;
  motivo: string;
};

export type EntitySummary = {
  resumo: string;
  destaques: string[];
  proximosPassos: string[];
};

export type AssistantReply = {
  resposta: string;
  acoesSugeridas: string[];
  contextoUsado: string[];
};

export interface AiProvider {
  readonly name: string;
  classifyLead(input: Record<string, unknown>): Promise<LeadClassification>;
  scoreLead(input: Record<string, unknown>): Promise<LeadScore>;
  suggestProperties(
    input: Record<string, unknown>,
  ): Promise<PropertySuggestion[]>;
  summarizeCliente(input: Record<string, unknown>): Promise<EntitySummary>;
  summarizeProprietario(input: Record<string, unknown>): Promise<EntitySummary>;
  assistCorretor(input: {
    pergunta: string;
    contexto?: Record<string, unknown>;
  }): Promise<AssistantReply>;
}
