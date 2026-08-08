import { LeadStatus } from '@prisma/client';

export const DEFAULT_PIPELINE_STAGES = [
  {
    nome: 'Aguardando contato',
    ordem: 1,
    cor: '#6366f1',
    status: LeadStatus.NOVO,
  },
  {
    nome: 'Primeiro Contato',
    ordem: 2,
    cor: '#8b5cf6',
    status: LeadStatus.PRIMEIRO_CONTATO,
  },
  {
    nome: 'Visita Agendada',
    ordem: 3,
    cor: '#a855f7',
    status: LeadStatus.VISITA_AGENDADA,
  },
  { nome: 'Proposta', ordem: 4, cor: '#f59e0b', status: LeadStatus.PROPOSTA },
  {
    nome: 'Negociação',
    ordem: 5,
    cor: '#f97316',
    status: LeadStatus.NEGOCIACAO,
  },
  { nome: 'Fechado', ordem: 6, cor: '#22c55e', status: LeadStatus.FECHADO },
  { nome: 'Perdido', ordem: 7, cor: '#ef4444', status: LeadStatus.PERDIDO },
] as const;

export function mapStageNameToStatus(nome: string): LeadStatus | null {
  const normalized = nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');

  const match = DEFAULT_PIPELINE_STAGES.find((stage) => {
    const stageKey = stage.nome
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_');
    return stageKey === normalized || stage.status === normalized;
  });

  return match?.status ?? null;
}
