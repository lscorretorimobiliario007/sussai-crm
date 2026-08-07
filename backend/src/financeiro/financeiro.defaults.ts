import {
  TipoCategoriaFinanceira,
  StatusLancamentoFinanceiro,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export const CATEGORIAS_PADRAO = [
  {
    nome: 'Aluguel',
    tipo: TipoCategoriaFinanceira.RECEITA,
    codigo: 'REC-ALUGUEL',
  },
  { nome: 'Venda', tipo: TipoCategoriaFinanceira.RECEITA, codigo: 'REC-VENDA' },
  {
    nome: 'Taxa de administração',
    tipo: TipoCategoriaFinanceira.RECEITA,
    codigo: 'REC-TAXA',
  },
  {
    nome: 'Outras receitas',
    tipo: TipoCategoriaFinanceira.RECEITA,
    codigo: 'REC-OUTRAS',
  },
  {
    nome: 'Comissão',
    tipo: TipoCategoriaFinanceira.DESPESA,
    codigo: 'DES-COMISSAO',
  },
  {
    nome: 'Marketing',
    tipo: TipoCategoriaFinanceira.DESPESA,
    codigo: 'DES-MKT',
  },
  {
    nome: 'Despesas operacionais',
    tipo: TipoCategoriaFinanceira.DESPESA,
    codigo: 'DES-OP',
  },
  {
    nome: 'Impostos',
    tipo: TipoCategoriaFinanceira.DESPESA,
    codigo: 'DES-IMP',
  },
  {
    nome: 'Outras despesas',
    tipo: TipoCategoriaFinanceira.DESPESA,
    codigo: 'DES-OUTRAS',
  },
] as const;

export async function ensureCatalogoPadrao(
  prisma: PrismaService,
  empresaId: number,
): Promise<void> {
  const [catCount, centroCount] = await Promise.all([
    prisma.categoriaFinanceira.count({ where: { empresaId } }),
    prisma.centroCusto.count({ where: { empresaId } }),
  ]);

  if (centroCount === 0) {
    await prisma.centroCusto.create({
      data: {
        empresaId,
        nome: 'Geral',
        codigo: 'GERAL',
        descricao: 'Centro de custo padrão',
      },
    });
  }

  if (catCount === 0) {
    await prisma.categoriaFinanceira.createMany({
      data: CATEGORIAS_PADRAO.map((item) => ({ ...item, empresaId })),
      skipDuplicates: true,
    });
  }
}

export async function atualizarLancamentosAtrasados(
  prisma: PrismaService,
  empresaId: number,
) {
  return prisma.lancamentoFinanceiro.updateMany({
    where: {
      empresaId,
      ativo: true,
      status: StatusLancamentoFinanceiro.ABERTO,
      vencimento: { lt: new Date() },
    },
    data: { status: StatusLancamentoFinanceiro.ATRASADO },
  });
}

export async function atualizarCobrancasAtrasadas(
  prisma: PrismaService,
  empresaId: number,
) {
  return prisma.cobranca.updateMany({
    where: {
      empresaId,
      status: 'PENDENTE',
      vencimento: { lt: new Date() },
    },
    data: { status: 'ATRASADO' },
  });
}

export function startOfDay(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function monthRange(ano: number, mes: number) {
  const inicio = new Date(ano, mes - 1, 1);
  const fim = new Date(ano, mes, 0, 23, 59, 59, 999);
  return { inicio, fim };
}

export function contratoNumero(id: number): string {
  return `CT-${String(id).padStart(6, '0')}`;
}
