import { Injectable } from '@nestjs/common';
import type {
  AiProvider,
  AssistantReply,
  EntitySummary,
  LeadClassification,
  LeadScore,
  PropertySuggestion,
} from '../ai.types';

function asText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return fallback;
}

/**
 * Deterministic local heuristics — production-safe default when AI_ENABLED
 * is false or no external provider key is configured.
 */
@Injectable()
export class RuleBasedAiProvider implements AiProvider {
  readonly name = 'rule-based-v1';

  classifyLead(input: Record<string, unknown>): Promise<LeadClassification> {
    const tipo = asText(input.tipoFormulario || input.canal)
      .toUpperCase()
      .trim();
    const mensagem = asText(input.mensagem || input.observacoes).toLowerCase();

    if (tipo === 'CAPTACAO' || tipo === 'ANUNCIO') {
      return Promise.resolve({
        categoria: 'captacao',
        confianca: 0.9,
        motivos: ['Formulario de captacao / anuncio'],
      });
    }
    if (tipo === 'VISITA' || mensagem.includes('visita')) {
      return Promise.resolve({
        categoria: 'visita',
        confianca: 0.85,
        motivos: ['Intencao de visita identificada'],
      });
    }
    if (tipo === 'CONTATO' || tipo === 'AVALIACAO') {
      return Promise.resolve({
        categoria: 'contato',
        confianca: 0.75,
        motivos: [`Tipo de formulario: ${tipo || 'CONTATO'}`],
      });
    }
    if (mensagem.includes('urgente') || mensagem.includes('agora')) {
      return Promise.resolve({
        categoria: 'quente',
        confianca: 0.7,
        motivos: ['Linguagem de urgencia na mensagem'],
      });
    }
    return Promise.resolve({
      categoria: 'morno',
      confianca: 0.55,
      motivos: ['Sem sinais fortes de prioridade'],
    });
  }

  scoreLead(input: Record<string, unknown>): Promise<LeadScore> {
    const fatores: LeadScore['fatores'] = [];
    let score = 40;

    if (input.telefone || input.whatsapp) {
      score += 15;
      fatores.push({
        nome: 'contato',
        peso: 15,
        detalhe: 'Telefone/WhatsApp informado',
      });
    }
    if (input.email) {
      score += 10;
      fatores.push({ nome: 'email', peso: 10, detalhe: 'E-mail informado' });
    }
    if (input.propertyId || input.imovelId) {
      score += 20;
      fatores.push({
        nome: 'imovel',
        peso: 20,
        detalhe: 'Lead vinculado a imovel',
      });
    }
    const tipo = asText(input.tipoFormulario).toUpperCase();
    if (tipo === 'VISITA' || tipo === 'CAPTACAO') {
      score += 15;
      fatores.push({
        nome: 'intencao',
        peso: 15,
        detalhe: `Alta intencao (${tipo})`,
      });
    }

    score = Math.max(0, Math.min(100, score));
    const faixa: LeadScore['faixa'] =
      score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D';

    return Promise.resolve({ score, faixa, fatores });
  }

  suggestProperties(
    input: Record<string, unknown>,
  ): Promise<PropertySuggestion[]> {
    const candidates = Array.isArray(input.candidatos)
      ? (input.candidatos as Array<Record<string, unknown>>)
      : [];

    return Promise.resolve(
      candidates.slice(0, 5).map((item, index) => ({
        propertyId: Number(item.id || item.propertyId || index + 1),
        titulo: asText(item.titulo, `Imovel #${index + 1}`),
        score: Math.max(10, 90 - index * 12),
        motivo: 'Heuristica local — substituivel por modelo de embedding',
      })),
    );
  }

  summarizeCliente(input: Record<string, unknown>): Promise<EntitySummary> {
    const nome = asText(input.nome, 'Cliente');
    return Promise.resolve({
      resumo: `${nome}: perfil comercial gerado localmente (IA preparada).`,
      destaques: [
        input.email ? `E-mail: ${asText(input.email)}` : 'Sem e-mail',
        input.telefone ? `Telefone: ${asText(input.telefone)}` : 'Sem telefone',
      ],
      proximosPassos: [
        'Confirmar preferencias de imovel',
        'Agendar proximo contato',
      ],
    });
  }

  summarizeProprietario(
    input: Record<string, unknown>,
  ): Promise<EntitySummary> {
    const nome = asText(input.nome, 'Proprietario');
    const imoveis = Number(input.totalImoveis || 0);
    return Promise.resolve({
      resumo: `${nome}: carteira com ${imoveis} imovel(is) (resumo heuristico).`,
      destaques: [
        imoveis > 0 ? 'Possui imoveis vinculados' : 'Sem imoveis vinculados',
      ],
      proximosPassos: ['Revisar documentacao', 'Atualizar status dos imoveis'],
    });
  }

  assistCorretor(input: {
    pergunta: string;
    contexto?: Record<string, unknown>;
  }): Promise<AssistantReply> {
    return Promise.resolve({
      resposta:
        'Assistente interno em modo preparado (rule-based). Conecte AI_PROVIDER=openai e AI_API_KEY para respostas generativas sem alterar o CRM.',
      acoesSugeridas: [
        'Abrir lead mais recente',
        'Sugerir 3 imoveis compativeis',
        'Registrar follow-up na agenda',
      ],
      contextoUsado: [
        `pergunta:${input.pergunta.slice(0, 120)}`,
        `provider:${this.name}`,
      ],
    });
  }
}
