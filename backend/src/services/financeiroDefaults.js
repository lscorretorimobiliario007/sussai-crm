import prisma from "../config/prisma.js";

const CATEGORIAS_PADRAO = [
  { nome: "Aluguel", tipo: "RECEITA", codigo: "REC-ALUGUEL" },
  { nome: "Venda", tipo: "RECEITA", codigo: "REC-VENDA" },
  { nome: "Taxa de administração", tipo: "RECEITA", codigo: "REC-TAXA" },
  { nome: "Outras receitas", tipo: "RECEITA", codigo: "REC-OUTRAS" },
  { nome: "Comissão", tipo: "DESPESA", codigo: "DES-COMISSAO" },
  { nome: "Marketing", tipo: "DESPESA", codigo: "DES-MKT" },
  { nome: "Despesas operacionais", tipo: "DESPESA", codigo: "DES-OP" },
  { nome: "Impostos", tipo: "DESPESA", codigo: "DES-IMP" },
  { nome: "Outras despesas", tipo: "DESPESA", codigo: "DES-OUTRAS" },
];

export async function ensureCatalogoPadrao(empresaId) {
  const [catCount, centroCount] = await Promise.all([
    prisma.categoriaFinanceira.count({ where: { empresaId } }),
    prisma.centroCusto.count({ where: { empresaId } }),
  ]);

  if (centroCount === 0) {
    await prisma.centroCusto.create({
      data: { empresaId, nome: "Geral", codigo: "GERAL", descricao: "Centro de custo padrão" },
    });
  }

  if (catCount === 0) {
    await prisma.categoriaFinanceira.createMany({
      data: CATEGORIAS_PADRAO.map((item) => ({ ...item, empresaId })),
      skipDuplicates: true,
    });
  }
}

export async function atualizarLancamentosAtrasados(empresaId) {
  return prisma.lancamentoFinanceiro.updateMany({
    where: {
      empresaId,
      ativo: true,
      status: "ABERTO",
      vencimento: { lt: new Date() },
    },
    data: { status: "ATRASADO" },
  });
}

export function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function endOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function monthRange(ano, mes) {
  const inicio = new Date(ano, mes - 1, 1);
  const fim = new Date(ano, mes, 0, 23, 59, 59, 999);
  return { inicio, fim };
}
