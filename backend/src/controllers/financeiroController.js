import prisma from "../config/prisma.js";
import { atualizarCobrancasAtrasadas } from "../utils/financeiro.js";
import { empresaScope } from "../utils/helpers.js";
import {
  belongsToEmpresa,
  hasInvalidEnum,
  normalizeDateFields,
  normalizeNumberFields,
  normalizeRelationIds,
  pickFields,
  sendControllerError,
} from "../utils/security.js";
import {
  atualizarLancamentosAtrasados,
  ensureCatalogoPadrao,
  monthRange,
  startOfDay,
} from "../services/financeiroDefaults.js";
import { buildFinanceiroExcel, buildFinanceiroPdf } from "../services/financeiroExport.js";

const LANCAMENTO_FIELDS = [
  "tipo", "descricao", "valor", "valorPago", "vencimento", "dataPagamento", "status",
  "formaPagamento", "categoriaId", "centroCustoId", "clienteId", "contratoId",
  "corretorId", "competencia", "observacoes",
];
const COBRANCA_FIELDS = [
  "contratoId", "descricao", "valor", "vencimento", "categoriaId", "centroCustoId", "formaPagamento",
];
const COMISSAO_FIELDS = [
  "corretorId", "contratoId", "lancamentoId", "centroCustoId", "descricao",
  "valorBase", "percentual", "valor", "status", "competencia", "observacoes",
];
const TIPOS_LANCAMENTO = ["A_RECEBER", "A_PAGAR"];
const STATUS_LANCAMENTO = ["ABERTO", "PARCIAL", "LIQUIDADO", "ATRASADO", "CANCELADO"];
const STATUS_COBRANCA = ["PENDENTE", "PAGO", "ATRASADO", "CANCELADO"];
const STATUS_COMISSAO = ["PREVISTA", "APROVADA", "PAGA", "CANCELADA"];
const TIPOS_CATEGORIA = ["RECEITA", "DESPESA"];
const FORMAS = ["PIX", "TED", "DINHEIRO", "CARTAO", "BOLETO", "CHEQUE", "OUTRO"];
const TIPOS_MOVIMENTO = ["ENTRADA", "SAIDA"];

function parsePage(query) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { page, limit };
}

function parseOptionalId(value) {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

async function refreshFinanceiro(empresaId) {
  await Promise.all([
    atualizarCobrancasAtrasadas(prisma, empresaId),
    atualizarLancamentosAtrasados(empresaId),
    ensureCatalogoPadrao(empresaId),
  ]);
}

const lancamentoInclude = {
  categoria: { select: { id: true, nome: true, tipo: true } },
  centroCusto: { select: { id: true, nome: true, codigo: true } },
  cliente: { select: { id: true, nome: true } },
  contrato: { select: { id: true, numero: true, tipo: true } },
  corretor: { select: { id: true, nome: true } },
  cobranca: { select: { id: true, status: true } },
};

async function syncLancamentoFromCobranca(tx, cobranca, contrato) {
  const statusMap = {
    PENDENTE: "ABERTO",
    ATRASADO: "ATRASADO",
    PAGO: "LIQUIDADO",
    CANCELADO: "CANCELADO",
  };
  const payload = {
    empresaId: cobranca.empresaId,
    tipo: "A_RECEBER",
    descricao: cobranca.descricao,
    valor: cobranca.valor,
    valorPago: cobranca.status === "PAGO" ? cobranca.valor : 0,
    vencimento: cobranca.vencimento,
    dataPagamento: cobranca.pagamento,
    status: statusMap[cobranca.status] || "ABERTO",
    formaPagamento: cobranca.formaPagamento || null,
    categoriaId: cobranca.categoriaId || null,
    centroCustoId: cobranca.centroCustoId || null,
    clienteId: contrato?.clienteId || null,
    contratoId: cobranca.contratoId,
    corretorId: contrato?.corretorId || null,
    competencia: startOfDay(new Date(cobranca.vencimento.getFullYear(), cobranca.vencimento.getMonth(), 1)),
  };

  if (cobranca.lancamentoId) {
    return tx.lancamentoFinanceiro.update({
      where: { id: cobranca.lancamentoId },
      data: payload,
    });
  }
  const lancamento = await tx.lancamentoFinanceiro.create({ data: payload });
  await tx.cobranca.update({
    where: { id: cobranca.id },
    data: { lancamentoId: lancamento.id },
  });
  return lancamento;
}

export async function listarOpcoesFinanceiro(req, res) {
  try {
    const scope = empresaScope(req);
    await ensureCatalogoPadrao(scope.empresaId);
    const [categorias, centros, clientes, contratos, corretores] = await Promise.all([
      prisma.categoriaFinanceira.findMany({
        where: { ...scope, ativo: true },
        orderBy: [{ tipo: "asc" }, { nome: "asc" }],
      }),
      prisma.centroCusto.findMany({
        where: { ...scope, ativo: true },
        orderBy: { nome: "asc" },
      }),
      prisma.cliente.findMany({
        where: { ...scope, ativo: true, tipo: { not: "PROPRIETARIO" } },
        select: { id: true, nome: true },
        orderBy: { nome: "asc" },
        take: 300,
      }),
      prisma.contrato.findMany({
        where: { ...scope, status: { in: ["ATIVO", "RASCUNHO"] } },
        select: { id: true, numero: true, tipo: true, valor: true, comissao: true, clienteId: true, corretorId: true },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.usuario.findMany({
        where: { ...scope, ativo: true, tipo: { in: ["CORRETOR", "GERENTE", "ADMIN"] } },
        select: { id: true, nome: true, comissaoPadrao: true },
        orderBy: { nome: "asc" },
        take: 200,
      }),
    ]);
    return res.json({
      categorias,
      centros,
      clientes,
      contratos,
      corretores,
      tiposLancamento: TIPOS_LANCAMENTO,
      statusLancamento: STATUS_LANCAMENTO,
      statusCobranca: STATUS_COBRANCA,
      statusComissao: STATUS_COMISSAO,
      formasPagamento: FORMAS,
      tiposCategoria: TIPOS_CATEGORIA,
      tiposMovimento: TIPOS_MOVIMENTO,
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao carregar opções financeiras");
  }
}

export async function dashboardFinanceiro(req, res) {
  try {
    const scope = empresaScope(req);
    await refreshFinanceiro(scope.empresaId);
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59, 999);

    const openStatuses = ["ABERTO", "PARCIAL", "ATRASADO"];
    const [
      aReceber, aPagar, recebidoMes, pagoMes,
      cobrancasAtrasadas, comissoesPendentes, comissoesPagasMes,
      serieReceber, seriePagar,
    ] = await Promise.all([
      prisma.lancamentoFinanceiro.aggregate({
        where: { ...scope, ativo: true, tipo: "A_RECEBER", status: { in: openStatuses } },
        _sum: { valor: true },
        _count: true,
      }),
      prisma.lancamentoFinanceiro.aggregate({
        where: { ...scope, ativo: true, tipo: "A_PAGAR", status: { in: openStatuses } },
        _sum: { valor: true },
        _count: true,
      }),
      prisma.lancamentoFinanceiro.aggregate({
        where: {
          ...scope, ativo: true, tipo: "A_RECEBER", status: "LIQUIDADO",
          dataPagamento: { gte: inicioMes, lte: fimMes },
        },
        _sum: { valorPago: true },
      }),
      prisma.lancamentoFinanceiro.aggregate({
        where: {
          ...scope, ativo: true, tipo: "A_PAGAR", status: "LIQUIDADO",
          dataPagamento: { gte: inicioMes, lte: fimMes },
        },
        _sum: { valorPago: true },
      }),
      prisma.cobranca.aggregate({
        where: { ...scope, status: "ATRASADO" },
        _sum: { valor: true },
        _count: true,
      }),
      prisma.comissao.aggregate({
        where: { ...scope, ativo: true, status: { in: ["PREVISTA", "APROVADA"] } },
        _sum: { valor: true },
        _count: true,
      }),
      prisma.comissao.aggregate({
        where: {
          ...scope, ativo: true, status: "PAGA",
          dataPagamento: { gte: inicioMes, lte: fimMes },
        },
        _sum: { valor: true },
      }),
      prisma.lancamentoFinanceiro.findMany({
        where: {
          ...scope, ativo: true, tipo: "A_RECEBER", status: "LIQUIDADO",
          dataPagamento: { gte: new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1) },
        },
        select: { dataPagamento: true, valorPago: true },
        take: 5000,
      }),
      prisma.lancamentoFinanceiro.findMany({
        where: {
          ...scope, ativo: true, tipo: "A_PAGAR", status: "LIQUIDADO",
          dataPagamento: { gte: new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1) },
        },
        select: { dataPagamento: true, valorPago: true },
        take: 5000,
      }),
    ]);

    const fluxoMensal = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const entradas = serieReceber
        .filter((item) => item.dataPagamento && item.dataPagamento.getFullYear() === d.getFullYear() && item.dataPagamento.getMonth() === d.getMonth())
        .reduce((sum, item) => sum + (item.valorPago || 0), 0);
      const saidas = seriePagar
        .filter((item) => item.dataPagamento && item.dataPagamento.getFullYear() === d.getFullYear() && item.dataPagamento.getMonth() === d.getMonth())
        .reduce((sum, item) => sum + (item.valorPago || 0), 0);
      fluxoMensal.push({
        competencia: key,
        label: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        entradas,
        saidas,
        saldo: entradas - saidas,
      });
    }

    return res.json({
      indicadores: {
        aReceber: aReceber._sum.valor || 0,
        aReceberQtd: aReceber._count || 0,
        aPagar: aPagar._sum.valor || 0,
        aPagarQtd: aPagar._count || 0,
        recebidoMes: recebidoMes._sum.valorPago || 0,
        pagoMes: pagoMes._sum.valorPago || 0,
        cobrancasAtrasadas: cobrancasAtrasadas._sum.valor || 0,
        cobrancasAtrasadasQtd: cobrancasAtrasadas._count || 0,
        comissoesPendentes: comissoesPendentes._sum.valor || 0,
        comissoesPendentesQtd: comissoesPendentes._count || 0,
        comissoesPagasMes: comissoesPagasMes._sum.valor || 0,
        resultadoMes: (recebidoMes._sum.valorPago || 0) - (pagoMes._sum.valorPago || 0),
      },
      fluxoMensal,
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao carregar dashboard financeiro");
  }
}

export async function indicadoresFinanceiro(req, res) {
  return dashboardFinanceiro(req, res);
}

export async function fluxoCaixa(req, res) {
  try {
    const scope = empresaScope(req);
    const inicio = req.query.inicio ? new Date(req.query.inicio) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const fim = req.query.fim ? new Date(req.query.fim) : new Date();
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
      return res.status(400).json({ erro: "Período inválido" });
    }

    const [receitas, despesas] = await Promise.all([
      prisma.lancamentoFinanceiro.findMany({
        where: {
          ...scope, ativo: true, tipo: "A_RECEBER", status: "LIQUIDADO",
          dataPagamento: { gte: inicio, lte: fim },
        },
        select: { dataPagamento: true, valorPago: true, valor: true },
        take: 5000,
      }),
      prisma.lancamentoFinanceiro.findMany({
        where: {
          ...scope, ativo: true, tipo: "A_PAGAR", status: "LIQUIDADO",
          dataPagamento: { gte: inicio, lte: fim },
        },
        select: { dataPagamento: true, valorPago: true, valor: true },
        take: 5000,
      }),
    ]);

    const map = new Map();
    const bump = (date, field, value) => {
      const key = startOfDay(date).toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, { data: key, entradas: 0, saidas: 0, saldo: 0 });
      const row = map.get(key);
      row[field] += value;
      row.saldo = row.entradas - row.saidas;
    };
    receitas.forEach((item) => bump(item.dataPagamento, "entradas", item.valorPago || item.valor || 0));
    despesas.forEach((item) => bump(item.dataPagamento, "saidas", item.valorPago || item.valor || 0));

    const serie = [...map.values()].sort((a, b) => a.data.localeCompare(b.data));
    let acumulado = 0;
    const comAcumulado = serie.map((row) => {
      acumulado += row.saldo;
      return { ...row, acumulado };
    });

    return res.json({
      periodo: { inicio, fim },
      totais: {
        entradas: comAcumulado.reduce((s, r) => s + r.entradas, 0),
        saidas: comAcumulado.reduce((s, r) => s + r.saidas, 0),
        saldo: acumulado,
      },
      serie: comAcumulado,
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao calcular fluxo de caixa");
  }
}

export async function dreSimplificado(req, res) {
  try {
    const scope = empresaScope(req);
    const ano = Number(req.query.ano) || new Date().getFullYear();
    const mes = Number(req.query.mes) || new Date().getMonth() + 1;
    if (mes < 1 || mes > 12) return res.status(400).json({ erro: "Mês inválido" });
    const { inicio, fim } = monthRange(ano, mes);

    const liquidacoes = await prisma.lancamentoFinanceiro.findMany({
      where: {
        ...scope,
        ativo: true,
        status: "LIQUIDADO",
        dataPagamento: { gte: inicio, lte: fim },
      },
      include: { categoria: { select: { id: true, nome: true, tipo: true } } },
      take: 5000,
    });

    const porCategoria = new Map();
    let receitas = 0;
    let despesas = 0;
    for (const item of liquidacoes) {
      const valor = item.valorPago || item.valor || 0;
      const tipoCat = item.tipo === "A_RECEBER" ? "RECEITA" : "DESPESA";
      if (tipoCat === "RECEITA") receitas += valor;
      else despesas += valor;
      const key = item.categoriaId || `${tipoCat}-sem`;
      if (!porCategoria.has(key)) {
        porCategoria.set(key, {
          categoriaId: item.categoriaId,
          nome: item.categoria?.nome || (tipoCat === "RECEITA" ? "Receitas sem categoria" : "Despesas sem categoria"),
          tipo: item.categoria?.tipo || tipoCat,
          valor: 0,
        });
      }
      porCategoria.get(key).valor += valor;
    }

    return res.json({
      periodo: { ano, mes, inicio, fim },
      receitas,
      despesas,
      resultado: receitas - despesas,
      categorias: [...porCategoria.values()].sort((a, b) => b.valor - a.valor),
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao gerar DRE");
  }
}

/* ---------- Catálogo ---------- */

export async function listarCategorias(req, res) {
  try {
    const scope = empresaScope(req);
    await ensureCatalogoPadrao(scope.empresaId);
    const data = await prisma.categoriaFinanceira.findMany({
      where: { ...scope, ...(req.query.ativo === "false" ? { ativo: false } : { ativo: true }) },
      orderBy: [{ tipo: "asc" }, { nome: "asc" }],
    });
    return res.json({ data });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao listar categorias");
  }
}

export async function criarCategoria(req, res) {
  try {
    const scope = empresaScope(req);
    const data = pickFields(req.body, ["nome", "tipo", "codigo"]);
    if (!data.nome?.trim()) return res.status(400).json({ erro: "Nome é obrigatório" });
    if (hasInvalidEnum(data, "tipo", TIPOS_CATEGORIA)) return res.status(400).json({ erro: "Tipo inválido" });
    const created = await prisma.categoriaFinanceira.create({
      data: {
        ...scope,
        nome: data.nome.trim(),
        tipo: data.tipo,
        codigo: data.codigo?.trim() || null,
      },
    });
    return res.status(201).json(created);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao criar categoria");
  }
}

export async function atualizarCategoria(req, res) {
  try {
    const scope = empresaScope(req);
    const id = Number(req.params.id);
    const existing = await prisma.categoriaFinanceira.findFirst({ where: { id, ...scope } });
    if (!existing) return res.status(404).json({ erro: "Categoria não encontrada" });
    const data = pickFields(req.body, ["nome", "tipo", "codigo", "ativo"]);
    if (data.tipo && hasInvalidEnum(data, "tipo", TIPOS_CATEGORIA)) return res.status(400).json({ erro: "Tipo inválido" });
    if (data.nome) data.nome = data.nome.trim();
    if (data.codigo != null) data.codigo = data.codigo.trim() || null;
    const updated = await prisma.categoriaFinanceira.updateMany({ where: { id, ...scope }, data });
    if (!updated.count) return res.status(404).json({ erro: "Categoria não encontrada" });
    const item = await prisma.categoriaFinanceira.findFirst({ where: { id, ...scope } });
    return res.json(item);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao atualizar categoria");
  }
}

export async function listarCentrosCusto(req, res) {
  try {
    const scope = empresaScope(req);
    await ensureCatalogoPadrao(scope.empresaId);
    const data = await prisma.centroCusto.findMany({
      where: { ...scope, ...(req.query.ativo === "false" ? { ativo: false } : { ativo: true }) },
      orderBy: { nome: "asc" },
    });
    return res.json({ data });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao listar centros de custo");
  }
}

export async function criarCentroCusto(req, res) {
  try {
    const scope = empresaScope(req);
    const data = pickFields(req.body, ["nome", "codigo", "descricao"]);
    if (!data.nome?.trim()) return res.status(400).json({ erro: "Nome é obrigatório" });
    const created = await prisma.centroCusto.create({
      data: {
        ...scope,
        nome: data.nome.trim(),
        codigo: data.codigo?.trim() || null,
        descricao: data.descricao?.trim() || null,
      },
    });
    return res.status(201).json(created);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao criar centro de custo");
  }
}

export async function atualizarCentroCusto(req, res) {
  try {
    const scope = empresaScope(req);
    const id = Number(req.params.id);
    const existing = await prisma.centroCusto.findFirst({ where: { id, ...scope } });
    if (!existing) return res.status(404).json({ erro: "Centro de custo não encontrado" });
    const data = pickFields(req.body, ["nome", "codigo", "descricao", "ativo"]);
    if (data.nome) data.nome = data.nome.trim();
    if (data.codigo != null) data.codigo = data.codigo.trim() || null;
    const updated = await prisma.centroCusto.updateMany({ where: { id, ...scope }, data });
    if (!updated.count) return res.status(404).json({ erro: "Centro de custo não encontrado" });
    const item = await prisma.centroCusto.findFirst({ where: { id, ...scope } });
    return res.json(item);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao atualizar centro de custo");
  }
}

/* ---------- Lançamentos ---------- */

function buildLancamentoWhere(req) {
  const scope = empresaScope(req);
  const {
    tipo, status, busca, categoriaId, centroCustoId, clienteId, contratoId, corretorId, conciliado,
  } = req.query;
  const catId = parseOptionalId(categoriaId);
  const centroId = parseOptionalId(centroCustoId);
  const cliId = parseOptionalId(clienteId);
  const ctrId = parseOptionalId(contratoId);
  const corId = parseOptionalId(corretorId);
  if ([catId, centroId, cliId, ctrId, corId].includes(null)) return { error: "Filtros inválidos" };
  if (tipo && !TIPOS_LANCAMENTO.includes(tipo)) return { error: "Tipo inválido" };
  if (status && !STATUS_LANCAMENTO.includes(status)) return { error: "Status inválido" };

  return {
    where: {
      ...scope,
      ativo: req.query.ativo === "false" ? false : true,
      ...(tipo && { tipo }),
      ...(status && { status }),
      ...(catId && { categoriaId: catId }),
      ...(centroId && { centroCustoId: centroId }),
      ...(cliId && { clienteId: cliId }),
      ...(ctrId && { contratoId: ctrId }),
      ...(corId && { corretorId: corId }),
      ...(conciliado === "true" && { conciliado: true }),
      ...(conciliado === "false" && { conciliado: false }),
      ...(busca && {
        OR: [
          { descricao: { contains: busca.trim(), mode: "insensitive" } },
          { observacoes: { contains: busca.trim(), mode: "insensitive" } },
        ],
      }),
    },
  };
}

export async function listarLancamentos(req, res) {
  try {
    await refreshFinanceiro(req.usuario.empresaId);
    const built = buildLancamentoWhere(req);
    if (built.error) return res.status(400).json({ erro: built.error });
    const { page, limit } = parsePage(req.query);
    const [total, data] = await prisma.$transaction([
      prisma.lancamentoFinanceiro.count({ where: built.where }),
      prisma.lancamentoFinanceiro.findMany({
        where: built.where,
        include: lancamentoInclude,
        orderBy: [{ vencimento: "asc" }, { id: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return res.json({
      data,
      meta: { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) },
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao listar lançamentos");
  }
}

export async function criarLancamento(req, res) {
  try {
    const scope = empresaScope(req);
    const data = normalizeRelationIds(
      pickFields(req.body, LANCAMENTO_FIELDS),
      ["categoriaId", "centroCustoId", "clienteId", "contratoId", "corretorId"],
    );
    if (!normalizeNumberFields(data, ["valor", "valorPago"]) || !normalizeDateFields(data, ["vencimento", "dataPagamento", "competencia"])) {
      return res.status(400).json({ erro: "Valores ou datas inválidos" });
    }
    if (hasInvalidEnum(data, "tipo", TIPOS_LANCAMENTO)) return res.status(400).json({ erro: "Tipo inválido" });
    if (data.status && hasInvalidEnum(data, "status", STATUS_LANCAMENTO)) return res.status(400).json({ erro: "Status inválido" });
    if (data.formaPagamento && hasInvalidEnum(data, "formaPagamento", FORMAS)) return res.status(400).json({ erro: "Forma de pagamento inválida" });
    if (!data.descricao?.trim() || data.valor == null || !data.vencimento || !data.tipo) {
      return res.status(400).json({ erro: "Tipo, descrição, valor e vencimento são obrigatórios" });
    }
    if (data.clienteId && !(await belongsToEmpresa(prisma, "cliente", data.clienteId, scope.empresaId))) {
      return res.status(400).json({ erro: "Cliente inválido" });
    }
    if (data.contratoId && !(await belongsToEmpresa(prisma, "contrato", data.contratoId, scope.empresaId))) {
      return res.status(400).json({ erro: "Contrato inválido" });
    }
    if (data.corretorId && !(await belongsToEmpresa(prisma, "usuario", data.corretorId, scope.empresaId))) {
      return res.status(400).json({ erro: "Corretor inválido" });
    }

    let status = data.status || "ABERTO";
    if (!data.status && data.vencimento < new Date()) status = "ATRASADO";

    const created = await prisma.lancamentoFinanceiro.create({
      data: {
        ...scope,
        ...data,
        descricao: data.descricao.trim(),
        status,
        valorPago: data.valorPago || 0,
      },
      include: lancamentoInclude,
    });
    return res.status(201).json(created);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao criar lançamento");
  }
}

export async function buscarLancamento(req, res) {
  try {
    const item = await prisma.lancamentoFinanceiro.findFirst({
      where: { id: Number(req.params.id), ...empresaScope(req) },
      include: lancamentoInclude,
    });
    if (!item) return res.status(404).json({ erro: "Lançamento não encontrado" });
    return res.json(item);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao buscar lançamento");
  }
}

export async function atualizarLancamento(req, res) {
  try {
    const scope = empresaScope(req);
    const existing = await prisma.lancamentoFinanceiro.findFirst({
      where: { id: Number(req.params.id), ...scope, ativo: true },
    });
    if (!existing) return res.status(404).json({ erro: "Lançamento não encontrado" });
    if (existing.status === "LIQUIDADO") {
      return res.status(409).json({ erro: "Lançamento liquidado não pode ser editado. Cancele e recrie se necessário." });
    }

    const data = normalizeRelationIds(
      pickFields(req.body, LANCAMENTO_FIELDS),
      ["categoriaId", "centroCustoId", "clienteId", "contratoId", "corretorId"],
    );
    if (!normalizeNumberFields(data, ["valor", "valorPago"]) || !normalizeDateFields(data, ["vencimento", "dataPagamento", "competencia"])) {
      return res.status(400).json({ erro: "Valores ou datas inválidos" });
    }
    if (data.tipo && hasInvalidEnum(data, "tipo", TIPOS_LANCAMENTO)) return res.status(400).json({ erro: "Tipo inválido" });
    if (data.status && hasInvalidEnum(data, "status", STATUS_LANCAMENTO)) return res.status(400).json({ erro: "Status inválido" });
    if (data.formaPagamento && hasInvalidEnum(data, "formaPagamento", FORMAS)) return res.status(400).json({ erro: "Forma inválida" });
    if (data.descricao) data.descricao = data.descricao.trim();

    const updated = await prisma.lancamentoFinanceiro.update({
      where: { id: existing.id },
      data,
      include: lancamentoInclude,
    });
    return res.json(updated);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao atualizar lançamento");
  }
}

export async function liquidarLancamento(req, res) {
  try {
    const scope = empresaScope(req);
    const existing = await prisma.lancamentoFinanceiro.findFirst({
      where: { id: Number(req.params.id), ...scope, ativo: true },
    });
    if (!existing) return res.status(404).json({ erro: "Lançamento não encontrado" });
    if (!["ABERTO", "PARCIAL", "ATRASADO"].includes(existing.status)) {
      return res.status(409).json({ erro: "Este lançamento não pode ser liquidado" });
    }

    const formaPagamento = req.body.formaPagamento;
    if (formaPagamento && !FORMAS.includes(formaPagamento)) {
      return res.status(400).json({ erro: "Forma de pagamento inválida" });
    }
    const valorPago = req.body.valorPago != null ? Number(req.body.valorPago) : existing.valor;
    if (!Number.isFinite(valorPago) || valorPago <= 0) {
      return res.status(400).json({ erro: "Valor pago inválido" });
    }
    const dataPagamento = req.body.dataPagamento ? new Date(req.body.dataPagamento) : new Date();
    const status = valorPago >= existing.valor ? "LIQUIDADO" : "PARCIAL";

    const updated = await prisma.$transaction(async (tx) => {
      const lancamento = await tx.lancamentoFinanceiro.update({
        where: { id: existing.id },
        data: {
          status,
          valorPago,
          dataPagamento,
          formaPagamento: formaPagamento || existing.formaPagamento,
        },
        include: lancamentoInclude,
      });

    if (lancamento.cobranca?.id && status === "LIQUIDADO") {
        await tx.cobranca.update({
          where: { id: lancamento.cobranca.id },
          data: { status: "PAGO", pagamento: dataPagamento, formaPagamento: formaPagamento || undefined },
        });
      }

      if (req.body.registrarNoCaixa !== false && status === "LIQUIDADO") {
        const dia = startOfDay(dataPagamento);
        let caixa = await tx.caixaDiario.findFirst({ where: { empresaId: scope.empresaId, data: dia } });
        if (!caixa) {
          caixa = await tx.caixaDiario.create({
            data: { empresaId: scope.empresaId, data: dia, saldoInicial: 0, status: "ABERTO" },
          });
        }
        if (caixa.status === "ABERTO") {
          await tx.movimentoCaixa.create({
            data: {
              empresaId: scope.empresaId,
              caixaDiarioId: caixa.id,
              tipo: existing.tipo === "A_RECEBER" ? "ENTRADA" : "SAIDA",
              descricao: existing.descricao,
              valor: valorPago,
              formaPagamento: formaPagamento || null,
              lancamentoId: existing.id,
            },
          });
        }
      }

      return lancamento;
    });

    return res.json(updated);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao liquidar lançamento");
  }
}

export async function cancelarLancamento(req, res) {
  try {
    const scope = empresaScope(req);
    const existing = await prisma.lancamentoFinanceiro.findFirst({
      where: { id: Number(req.params.id), ...scope, ativo: true },
    });
    if (!existing) return res.status(404).json({ erro: "Lançamento não encontrado" });
    const updated = await prisma.lancamentoFinanceiro.update({
      where: { id: existing.id },
      data: { status: "CANCELADO", ativo: false },
      include: lancamentoInclude,
    });
    return res.json(updated);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao cancelar lançamento");
  }
}

/* ---------- Cobranças ---------- */

export async function listarCobrancas(req, res) {
  try {
    const { status, mes, ano, busca } = req.query;
    const where = { ...empresaScope(req) };
    await atualizarCobrancasAtrasadas(prisma, req.usuario.empresaId);

    if (status) {
      if (!STATUS_COBRANCA.includes(status)) return res.status(400).json({ erro: "Status inválido" });
      where.status = status;
    }
    if (Boolean(mes) !== Boolean(ano)) return res.status(400).json({ erro: "Informe mês e ano juntos" });
    if (mes && ano) {
      const mesN = Number(mes);
      const anoN = Number(ano);
      if (!Number.isInteger(mesN) || mesN < 1 || mesN > 12 || !Number.isInteger(anoN)) {
        return res.status(400).json({ erro: "Mês ou ano inválido" });
      }
      const inicio = new Date(anoN, mesN - 1, 1);
      const fim = new Date(anoN, mesN, 1);
      where.vencimento = { gte: inicio, lt: fim };
    }
    if (busca) {
      where.OR = [
        { descricao: { contains: busca.trim(), mode: "insensitive" } },
        { contrato: { numero: { contains: busca.trim(), mode: "insensitive" } } },
      ];
    }

    const { page, limit } = parsePage(req.query);
    const [total, cobrancas] = await prisma.$transaction([
      prisma.cobranca.count({ where }),
      prisma.cobranca.findMany({
        where,
        include: {
          contrato: {
            select: {
              id: true, numero: true, tipo: true, empresaId: true,
              cliente: { select: { id: true, nome: true, empresaId: true } },
              imovel: { select: { id: true, titulo: true, codigo: true, empresaId: true } },
              corretor: { select: { id: true, nome: true, empresaId: true } },
            },
          },
          categoria: { select: { id: true, nome: true } },
          centroCusto: { select: { id: true, nome: true } },
        },
        orderBy: { vencimento: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return res.json({
      data: cobrancas.map((c) => ({
        ...c,
        contrato: c.contrato?.empresaId === req.usuario.empresaId
          ? {
              id: c.contrato.id,
              numero: c.contrato.numero,
              tipo: c.contrato.tipo,
              cliente: c.contrato.cliente?.empresaId === req.usuario.empresaId
                ? { id: c.contrato.cliente.id, nome: c.contrato.cliente.nome }
                : null,
              imovel: c.contrato.imovel?.empresaId === req.usuario.empresaId
                ? { id: c.contrato.imovel.id, titulo: c.contrato.imovel.titulo, codigo: c.contrato.imovel.codigo }
                : null,
              corretor: c.contrato.corretor?.empresaId === req.usuario.empresaId
                ? { id: c.contrato.corretor.id, nome: c.contrato.corretor.nome }
                : null,
            }
          : null,
      })),
      meta: { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) },
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao listar cobranças");
  }
}

export async function criarCobranca(req, res) {
  try {
    const scope = empresaScope(req);
    const data = normalizeRelationIds(
      pickFields(req.body, COBRANCA_FIELDS),
      ["contratoId", "categoriaId", "centroCustoId"],
    );
    if (!normalizeNumberFields(data, ["valor"]) || !normalizeDateFields(data, ["vencimento"])) {
      return res.status(400).json({ erro: "Valor ou vencimento inválidos" });
    }
    if (!data.contratoId || !data.descricao || data.valor == null || !data.vencimento) {
      return res.status(400).json({ erro: "Contrato, descrição, valor e vencimento são obrigatórios" });
    }
    if (data.formaPagamento && !FORMAS.includes(data.formaPagamento)) {
      return res.status(400).json({ erro: "Forma de pagamento inválida" });
    }
    const contrato = await prisma.contrato.findFirst({
      where: { id: data.contratoId, empresaId: scope.empresaId },
    });
    if (!contrato) return res.status(400).json({ erro: "Contrato inválido para esta empresa" });

    const cobranca = await prisma.$transaction(async (tx) => {
      const created = await tx.cobranca.create({
        data: {
          ...data,
          ...scope,
          descricao: data.descricao.trim(),
          pagamento: null,
          status: data.vencimento < new Date() ? "ATRASADO" : "PENDENTE",
        },
      });
      await syncLancamentoFromCobranca(tx, created, contrato);
      return tx.cobranca.findFirst({
        where: { id: created.id },
        include: {
          contrato: { select: { numero: true, cliente: { select: { nome: true } } } },
          lancamento: { select: { id: true, status: true } },
        },
      });
    });

    return res.status(201).json(cobranca);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao criar cobrança");
  }
}

export async function registrarPagamento(req, res) {
  try {
    const scope = empresaScope(req);
    const existe = await prisma.cobranca.findFirst({
      where: { id: Number(req.params.id), ...scope },
      include: { contrato: true },
    });
    if (!existe) return res.status(404).json({ erro: "Cobrança não encontrada" });
    if (!["PENDENTE", "ATRASADO"].includes(existe.status)) {
      return res.status(409).json({ erro: "Apenas cobranças pendentes ou atrasadas podem receber pagamento" });
    }
    const formaPagamento = req.body.formaPagamento;
    if (formaPagamento && !FORMAS.includes(formaPagamento)) {
      return res.status(400).json({ erro: "Forma de pagamento inválida" });
    }

    const cobranca = await prisma.$transaction(async (tx) => {
      const updated = await tx.cobranca.update({
        where: { id: existe.id },
        data: {
          status: "PAGO",
          pagamento: new Date(),
          ...(formaPagamento && { formaPagamento }),
        },
      });
      await syncLancamentoFromCobranca(tx, updated, existe.contrato);

      if (updated.lancamentoId) {
        const dia = startOfDay(new Date());
        let caixa = await tx.caixaDiario.findFirst({ where: { empresaId: scope.empresaId, data: dia } });
        if (!caixa) {
          caixa = await tx.caixaDiario.create({
            data: { empresaId: scope.empresaId, data: dia, saldoInicial: 0, status: "ABERTO" },
          });
        }
        if (caixa.status === "ABERTO") {
          await tx.movimentoCaixa.create({
            data: {
              empresaId: scope.empresaId,
              caixaDiarioId: caixa.id,
              tipo: "ENTRADA",
              descricao: updated.descricao,
              valor: updated.valor,
              formaPagamento: formaPagamento || null,
              lancamentoId: updated.lancamentoId,
            },
          });
        }
      }
      return updated;
    });

    return res.json(cobranca);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao registrar pagamento");
  }
}

export async function resumoFinanceiro(req, res) {
  try {
    const scope = empresaScope(req);
    await refreshFinanceiro(scope.empresaId);
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const openStatuses = ["ABERTO", "PARCIAL", "ATRASADO"];

    const [recebidoMes, aReceber, atrasado, previstoMes] = await Promise.all([
      prisma.lancamentoFinanceiro.aggregate({
        where: {
          ...scope, ativo: true, tipo: "A_RECEBER", status: "LIQUIDADO",
          dataPagamento: { gte: inicioMes },
        },
        _sum: { valorPago: true },
      }),
      prisma.lancamentoFinanceiro.aggregate({
        where: { ...scope, ativo: true, tipo: "A_RECEBER", status: { in: openStatuses } },
        _sum: { valor: true },
      }),
      prisma.cobranca.aggregate({
        where: { ...scope, status: "ATRASADO" },
        _sum: { valor: true },
      }),
      prisma.cobranca.aggregate({
        where: {
          ...scope,
          vencimento: {
            gte: inicioMes,
            lt: new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1),
          },
        },
        _sum: { valor: true },
      }),
    ]);

    return res.json({
      recebido: recebidoMes._sum.valorPago || 0,
      pendente: aReceber._sum.valor || 0,
      atrasado: atrasado._sum.valor || 0,
      totalMes: previstoMes._sum.valor || 0,
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao carregar resumo financeiro");
  }
}

export async function gerarCobrancasMensais(req, res) {
  try {
    const scope = empresaScope(req);
    await ensureCatalogoPadrao(scope.empresaId);
    const hoje = new Date();
    const mes = hoje.getMonth();
    const ano = hoje.getFullYear();
    const inicioCompetencia = new Date(ano, mes, 1);
    const inicioProximaCompetencia = new Date(ano, mes + 1, 1);
    const ultimoDiaCompetencia = new Date(ano, mes + 1, 0).getDate();
    const catAluguel = await prisma.categoriaFinanceira.findFirst({
      where: { empresaId: scope.empresaId, codigo: "REC-ALUGUEL" },
    });

    const cobrancasCriadas = await prisma.$transaction(async (tx) => {
      const contratos = await tx.contrato.findMany({
        where: {
          ...scope,
          status: "ATIVO",
          tipo: { in: ["ALUGUEL", "ADMINISTRACAO"] },
          dataInicio: { lt: inicioProximaCompetencia },
          OR: [{ dataFim: null }, { dataFim: { gte: inicioCompetencia } }],
        },
      });

      const criadas = [];
      for (const contrato of contratos) {
        const existe = await tx.cobranca.findFirst({
          where: {
            empresaId: scope.empresaId,
            contratoId: contrato.id,
            vencimento: { gte: inicioCompetencia, lt: inicioProximaCompetencia },
          },
        });
        if (existe) continue;

        const dia = Math.min(contrato.diaVencimento || 10, ultimoDiaCompetencia);
        const dataVencimento = new Date(ano, mes, dia);
        const cobranca = await tx.cobranca.create({
          data: {
            empresaId: scope.empresaId,
            contratoId: contrato.id,
            descricao: `Aluguel ${String(mes + 1).padStart(2, "0")}/${ano}`,
            valor: contrato.valor,
            vencimento: dataVencimento,
            status: dataVencimento < hoje ? "ATRASADO" : "PENDENTE",
            categoriaId: catAluguel?.id || null,
          },
        });
        await syncLancamentoFromCobranca(tx, cobranca, contrato);
        criadas.push(cobranca);
      }
      return criadas;
    }, { isolationLevel: "Serializable" });

    return res.json({
      mensagem: `${cobrancasCriadas.length} cobranças geradas`,
      cobrancas: cobrancasCriadas,
    });
  } catch (error) {
    if (error.code === "P2034") {
      return res.status(409).json({ erro: "As cobranças estão sendo geradas por outro usuário. Tente novamente." });
    }
    return sendControllerError(res, error, "Erro ao gerar cobranças");
  }
}

/* ---------- Comissões ---------- */

export async function listarComissoes(req, res) {
  try {
    const scope = empresaScope(req);
    const { status, corretorId, busca } = req.query;
    const corId = parseOptionalId(corretorId);
    if (corId === null) return res.status(400).json({ erro: "Corretor inválido" });
    if (status && !STATUS_COMISSAO.includes(status)) return res.status(400).json({ erro: "Status inválido" });
    const where = {
      ...scope,
      ativo: req.query.ativo === "false" ? false : true,
      ...(status && { status }),
      ...(corId && { corretorId: corId }),
      ...(busca && { descricao: { contains: busca.trim(), mode: "insensitive" } }),
    };
    const { page, limit } = parsePage(req.query);
    const [total, data] = await prisma.$transaction([
      prisma.comissao.count({ where }),
      prisma.comissao.findMany({
        where,
        include: {
          corretor: { select: { id: true, nome: true } },
          contrato: { select: { id: true, numero: true } },
          centroCusto: { select: { id: true, nome: true } },
        },
        orderBy: [{ competencia: "desc" }, { id: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return res.json({
      data,
      meta: { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) },
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao listar comissões");
  }
}

export async function criarComissao(req, res) {
  try {
    const scope = empresaScope(req);
    const data = normalizeRelationIds(
      pickFields(req.body, COMISSAO_FIELDS),
      ["corretorId", "contratoId", "lancamentoId", "centroCustoId"],
    );
    if (!normalizeNumberFields(data, ["valorBase", "percentual", "valor"]) || !normalizeDateFields(data, ["competencia", "dataPagamento"])) {
      return res.status(400).json({ erro: "Valores ou datas inválidos" });
    }
    if (!data.corretorId || !data.descricao?.trim() || data.valor == null || !data.competencia) {
      return res.status(400).json({ erro: "Corretor, descrição, valor e competência são obrigatórios" });
    }
    if (!(await belongsToEmpresa(prisma, "usuario", data.corretorId, scope.empresaId))) {
      return res.status(400).json({ erro: "Corretor inválido" });
    }
    if (data.status && hasInvalidEnum(data, "status", STATUS_COMISSAO)) {
      return res.status(400).json({ erro: "Status inválido" });
    }
    const created = await prisma.comissao.create({
      data: {
        ...scope,
        ...data,
        descricao: data.descricao.trim(),
        valorBase: data.valorBase ?? data.valor,
        percentual: data.percentual ?? 0,
        status: data.status || "PREVISTA",
      },
      include: {
        corretor: { select: { id: true, nome: true } },
        contrato: { select: { id: true, numero: true } },
      },
    });
    return res.status(201).json(created);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao criar comissão");
  }
}

export async function atualizarComissao(req, res) {
  try {
    const scope = empresaScope(req);
    const existing = await prisma.comissao.findFirst({ where: { id: Number(req.params.id), ...scope, ativo: true } });
    if (!existing) return res.status(404).json({ erro: "Comissão não encontrada" });
    if (existing.status === "PAGA") return res.status(409).json({ erro: "Comissão paga não pode ser editada" });

    const data = normalizeRelationIds(
      pickFields(req.body, COMISSAO_FIELDS),
      ["corretorId", "contratoId", "lancamentoId", "centroCustoId"],
    );
    if (!normalizeNumberFields(data, ["valorBase", "percentual", "valor"]) || !normalizeDateFields(data, ["competencia", "dataPagamento"])) {
      return res.status(400).json({ erro: "Valores ou datas inválidos" });
    }
    if (data.status && hasInvalidEnum(data, "status", STATUS_COMISSAO)) return res.status(400).json({ erro: "Status inválido" });
    if (data.descricao) data.descricao = data.descricao.trim();
    const updated = await prisma.comissao.update({
      where: { id: existing.id },
      data,
      include: { corretor: { select: { id: true, nome: true } }, contrato: { select: { id: true, numero: true } } },
    });
    return res.json(updated);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao atualizar comissão");
  }
}

export async function aprovarComissao(req, res) {
  try {
    const scope = empresaScope(req);
    const existing = await prisma.comissao.findFirst({ where: { id: Number(req.params.id), ...scope, ativo: true } });
    if (!existing) return res.status(404).json({ erro: "Comissão não encontrada" });
    if (existing.status !== "PREVISTA") return res.status(409).json({ erro: "Somente comissões previstas podem ser aprovadas" });
    const updated = await prisma.comissao.update({
      where: { id: existing.id },
      data: { status: "APROVADA" },
    });
    return res.json(updated);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao aprovar comissão");
  }
}

export async function pagarComissao(req, res) {
  try {
    const scope = empresaScope(req);
    const existing = await prisma.comissao.findFirst({ where: { id: Number(req.params.id), ...scope, ativo: true } });
    if (!existing) return res.status(404).json({ erro: "Comissão não encontrada" });
    if (!["PREVISTA", "APROVADA"].includes(existing.status)) {
      return res.status(409).json({ erro: "Comissão não pode ser paga neste status" });
    }

    const catComissao = await prisma.categoriaFinanceira.findFirst({
      where: { empresaId: scope.empresaId, codigo: "DES-COMISSAO" },
    });

    const result = await prisma.$transaction(async (tx) => {
      const lancamento = await tx.lancamentoFinanceiro.create({
        data: {
          empresaId: scope.empresaId,
          tipo: "A_PAGAR",
          descricao: existing.descricao,
          valor: existing.valor,
          valorPago: existing.valor,
          vencimento: new Date(),
          dataPagamento: new Date(),
          status: "LIQUIDADO",
          categoriaId: catComissao?.id || null,
          centroCustoId: existing.centroCustoId,
          corretorId: existing.corretorId,
          contratoId: existing.contratoId,
          competencia: existing.competencia,
        },
      });

      const comissao = await tx.comissao.update({
        where: { id: existing.id },
        data: { status: "PAGA", dataPagamento: new Date(), lancamentoId: lancamento.id },
      });

      const dia = startOfDay(new Date());
      let caixa = await tx.caixaDiario.findFirst({ where: { empresaId: scope.empresaId, data: dia } });
      if (!caixa) {
        caixa = await tx.caixaDiario.create({
          data: { empresaId: scope.empresaId, data: dia, saldoInicial: 0, status: "ABERTO" },
        });
      }
      if (caixa.status === "ABERTO") {
        await tx.movimentoCaixa.create({
          data: {
            empresaId: scope.empresaId,
            caixaDiarioId: caixa.id,
            tipo: "SAIDA",
            descricao: existing.descricao,
            valor: existing.valor,
            comissaoId: existing.id,
            lancamentoId: lancamento.id,
          },
        });
      }

      return comissao;
    });

    return res.json(result);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao pagar comissão");
  }
}

export async function gerarComissaoDeContrato(req, res) {
  try {
    const scope = empresaScope(req);
    const contrato = await prisma.contrato.findFirst({
      where: { id: Number(req.params.contratoId), ...scope },
      include: { corretor: { select: { id: true, nome: true, comissaoPadrao: true } } },
    });
    if (!contrato) return res.status(404).json({ erro: "Contrato não encontrado" });
    if (!contrato.corretorId) return res.status(400).json({ erro: "Contrato sem corretor vinculado" });

    const percentual = contrato.comissao != null
      ? (contrato.comissao <= 100 ? contrato.comissao : (contrato.comissao / contrato.valor) * 100)
      : (contrato.corretor?.comissaoPadrao ?? 5);
    const valor = contrato.comissao != null && contrato.comissao > 100
      ? contrato.comissao
      : (contrato.valor * percentual) / 100;

    const created = await prisma.comissao.create({
      data: {
        ...scope,
        corretorId: contrato.corretorId,
        contratoId: contrato.id,
        descricao: `Comissão contrato ${contrato.numero}`,
        valorBase: contrato.valor,
        percentual,
        valor,
        status: "PREVISTA",
        competencia: startOfDay(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
      },
      include: {
        corretor: { select: { id: true, nome: true } },
        contrato: { select: { id: true, numero: true } },
      },
    });
    return res.status(201).json(created);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao gerar comissão do contrato");
  }
}

/* ---------- Caixa diário ---------- */

export async function listarCaixas(req, res) {
  try {
    const scope = empresaScope(req);
    const { page, limit } = parsePage(req.query);
    const where = { ...scope };
    const [total, data] = await prisma.$transaction([
      prisma.caixaDiario.count({ where }),
      prisma.caixaDiario.findMany({
        where,
        include: {
          fechadoPor: { select: { id: true, nome: true } },
          _count: { select: { movimentos: true } },
        },
        orderBy: { data: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return res.json({
      data,
      meta: { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) },
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao listar caixas");
  }
}

export async function abrirCaixa(req, res) {
  try {
    const scope = empresaScope(req);
    const dataRef = req.body.data ? startOfDay(new Date(req.body.data)) : startOfDay(new Date());
    if (Number.isNaN(dataRef.getTime())) return res.status(400).json({ erro: "Data inválida" });
    const saldoInicial = Number(req.body.saldoInicial || 0);
    if (!Number.isFinite(saldoInicial)) return res.status(400).json({ erro: "Saldo inicial inválido" });

    const existing = await prisma.caixaDiario.findFirst({
      where: { empresaId: scope.empresaId, data: dataRef },
    });
    if (existing) return res.status(409).json({ erro: "Já existe caixa para esta data", caixa: existing });

    const created = await prisma.caixaDiario.create({
      data: {
        ...scope,
        data: dataRef,
        saldoInicial,
        status: "ABERTO",
        observacoes: req.body.observacoes?.trim() || null,
      },
    });
    return res.status(201).json(created);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao abrir caixa");
  }
}

export async function buscarCaixa(req, res) {
  try {
    const caixa = await prisma.caixaDiario.findFirst({
      where: { id: Number(req.params.id), ...empresaScope(req) },
      include: {
        fechadoPor: { select: { id: true, nome: true } },
        movimentos: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!caixa) return res.status(404).json({ erro: "Caixa não encontrado" });
    const entradas = caixa.movimentos.filter((m) => m.tipo === "ENTRADA").reduce((s, m) => s + m.valor, 0);
    const saidas = caixa.movimentos.filter((m) => m.tipo === "SAIDA").reduce((s, m) => s + m.valor, 0);
    return res.json({
      ...caixa,
      totais: {
        entradas,
        saidas,
        saldoAtual: caixa.saldoInicial + entradas - saidas,
      },
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao buscar caixa");
  }
}

export async function adicionarMovimentoCaixa(req, res) {
  try {
    const scope = empresaScope(req);
    const caixa = await prisma.caixaDiario.findFirst({
      where: { id: Number(req.params.id), ...scope },
    });
    if (!caixa) return res.status(404).json({ erro: "Caixa não encontrado" });
    if (caixa.status !== "ABERTO") return res.status(409).json({ erro: "Caixa fechado não aceita movimentos" });

    const data = pickFields(req.body, ["tipo", "descricao", "valor", "formaPagamento", "lancamentoId", "comissaoId"]);
    if (!TIPOS_MOVIMENTO.includes(data.tipo)) return res.status(400).json({ erro: "Tipo inválido" });
    if (!data.descricao?.trim()) return res.status(400).json({ erro: "Descrição obrigatória" });
    const valor = Number(data.valor);
    if (!Number.isFinite(valor) || valor <= 0) return res.status(400).json({ erro: "Valor inválido" });
    if (data.formaPagamento && !FORMAS.includes(data.formaPagamento)) {
      return res.status(400).json({ erro: "Forma de pagamento inválida" });
    }

    const created = await prisma.movimentoCaixa.create({
      data: {
        empresaId: scope.empresaId,
        caixaDiarioId: caixa.id,
        tipo: data.tipo,
        descricao: data.descricao.trim(),
        valor,
        formaPagamento: data.formaPagamento || null,
        lancamentoId: data.lancamentoId ? Number(data.lancamentoId) : null,
        comissaoId: data.comissaoId ? Number(data.comissaoId) : null,
      },
    });
    return res.status(201).json(created);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao registrar movimento");
  }
}

export async function fecharCaixa(req, res) {
  try {
    const scope = empresaScope(req);
    const caixa = await prisma.caixaDiario.findFirst({
      where: { id: Number(req.params.id), ...scope },
      include: { movimentos: true },
    });
    if (!caixa) return res.status(404).json({ erro: "Caixa não encontrado" });
    if (caixa.status === "FECHADO") return res.status(409).json({ erro: "Caixa já está fechado" });

    const entradas = caixa.movimentos.filter((m) => m.tipo === "ENTRADA").reduce((s, m) => s + m.valor, 0);
    const saidas = caixa.movimentos.filter((m) => m.tipo === "SAIDA").reduce((s, m) => s + m.valor, 0);
    const saldoFinal = caixa.saldoInicial + entradas - saidas;

    const updated = await prisma.caixaDiario.update({
      where: { id: caixa.id },
      data: {
        status: "FECHADO",
        saldoFinal,
        fechadoPorId: req.usuario.id,
        fechadoEm: new Date(),
        observacoes: req.body.observacoes?.trim() || caixa.observacoes,
      },
    });
    return res.json(updated);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao fechar caixa");
  }
}

/* ---------- Conciliação ---------- */

export async function listarConciliacoes(req, res) {
  try {
    const scope = empresaScope(req);
    const { page, limit } = parsePage(req.query);
    const where = { ...scope, ...(req.query.status && { status: req.query.status }) };
    const [total, data] = await prisma.$transaction([
      prisma.conciliacao.count({ where }),
      prisma.conciliacao.findMany({
        where,
        include: {
          criadoPor: { select: { id: true, nome: true } },
          _count: { select: { itens: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return res.json({
      data,
      meta: { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) },
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao listar conciliações");
  }
}

export async function criarConciliacao(req, res) {
  try {
    const scope = empresaScope(req);
    const titulo = req.body.titulo?.trim();
    const periodoInicio = new Date(req.body.periodoInicio);
    const periodoFim = new Date(req.body.periodoFim);
    if (!titulo || Number.isNaN(periodoInicio.getTime()) || Number.isNaN(periodoFim.getTime())) {
      return res.status(400).json({ erro: "Título e período são obrigatórios" });
    }

    const lancamentos = await prisma.lancamentoFinanceiro.findMany({
      where: {
        ...scope,
        ativo: true,
        status: "LIQUIDADO",
        conciliado: false,
        dataPagamento: { gte: periodoInicio, lte: periodoFim },
      },
      take: 1000,
    });

    const saldoSistema = lancamentos.reduce((sum, item) => {
      const valor = item.valorPago || item.valor || 0;
      return sum + (item.tipo === "A_RECEBER" ? valor : -valor);
    }, 0);

    const created = await prisma.$transaction(async (tx) => {
      const conc = await tx.conciliacao.create({
        data: {
          ...scope,
          titulo,
          periodoInicio,
          periodoFim,
          saldoExtrato: req.body.saldoExtrato != null ? Number(req.body.saldoExtrato) : null,
          saldoSistema,
          observacoes: req.body.observacoes?.trim() || null,
          criadoPorId: req.usuario.id,
          status: "ABERTA",
        },
      });
      if (lancamentos.length) {
        await tx.conciliacaoItem.createMany({
          data: lancamentos.map((item) => ({
            empresaId: scope.empresaId,
            conciliacaoId: conc.id,
            lancamentoId: item.id,
            descricao: item.descricao,
            valor: item.tipo === "A_RECEBER" ? (item.valorPago || item.valor) : -(item.valorPago || item.valor),
            dataReferencia: item.dataPagamento,
            conciliado: false,
          })),
        });
      }
      return tx.conciliacao.findFirst({
        where: { id: conc.id },
        include: { itens: true, criadoPor: { select: { id: true, nome: true } } },
      });
    });

    return res.status(201).json(created);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao criar conciliação");
  }
}

export async function buscarConciliacao(req, res) {
  try {
    const item = await prisma.conciliacao.findFirst({
      where: { id: Number(req.params.id), ...empresaScope(req) },
      include: {
        criadoPor: { select: { id: true, nome: true } },
        itens: { orderBy: { id: "asc" } },
      },
    });
    if (!item) return res.status(404).json({ erro: "Conciliação não encontrada" });
    return res.json(item);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao buscar conciliação");
  }
}

export async function adicionarItemConciliacao(req, res) {
  try {
    const scope = empresaScope(req);
    const conc = await prisma.conciliacao.findFirst({
      where: { id: Number(req.params.id), ...scope, status: "ABERTA" },
    });
    if (!conc) return res.status(404).json({ erro: "Conciliação aberta não encontrada" });

    const descricao = req.body.descricao?.trim();
    const valor = Number(req.body.valor);
    if (!descricao || !Number.isFinite(valor)) return res.status(400).json({ erro: "Descrição e valor são obrigatórios" });

    const item = await prisma.conciliacaoItem.create({
      data: {
        empresaId: scope.empresaId,
        conciliacaoId: conc.id,
        descricao,
        valor,
        dataReferencia: req.body.dataReferencia ? new Date(req.body.dataReferencia) : null,
        lancamentoId: req.body.lancamentoId ? Number(req.body.lancamentoId) : null,
        movimentoCaixaId: req.body.movimentoCaixaId ? Number(req.body.movimentoCaixaId) : null,
        conciliado: Boolean(req.body.conciliado),
      },
    });
    return res.status(201).json(item);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao adicionar item");
  }
}

export async function finalizarConciliacao(req, res) {
  try {
    const scope = empresaScope(req);
    const conc = await prisma.conciliacao.findFirst({
      where: { id: Number(req.params.id), ...scope, status: "ABERTA" },
      include: { itens: true },
    });
    if (!conc) return res.status(404).json({ erro: "Conciliação aberta não encontrada" });

    const updated = await prisma.$transaction(async (tx) => {
      const lancamentoIds = conc.itens.map((i) => i.lancamentoId).filter(Boolean);
      if (lancamentoIds.length) {
        await tx.lancamentoFinanceiro.updateMany({
          where: { id: { in: lancamentoIds }, empresaId: scope.empresaId },
          data: { conciliado: true },
        });
      }
      await tx.conciliacaoItem.updateMany({
        where: { conciliacaoId: conc.id, empresaId: scope.empresaId },
        data: { conciliado: true },
      });
      return tx.conciliacao.update({
        where: { id: conc.id },
        data: {
          status: "CONCILIADA",
          saldoExtrato: req.body.saldoExtrato != null ? Number(req.body.saldoExtrato) : conc.saldoExtrato,
          observacoes: req.body.observacoes?.trim() || conc.observacoes,
        },
        include: { itens: true },
      });
    });

    return res.json(updated);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao finalizar conciliação");
  }
}

/* ---------- Export ---------- */

export async function exportarExcel(req, res) {
  try {
    await refreshFinanceiro(req.usuario.empresaId);
    const built = buildLancamentoWhere(req);
    if (built.error) return res.status(400).json({ erro: built.error });
    const data = await prisma.lancamentoFinanceiro.findMany({
      where: built.where,
      include: lancamentoInclude,
      orderBy: { vencimento: "desc" },
      take: 5000,
    });
    await buildFinanceiroExcel(data, res);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao exportar Excel");
  }
}

export async function exportarPdf(req, res) {
  try {
    await refreshFinanceiro(req.usuario.empresaId);
    const built = buildLancamentoWhere(req);
    if (built.error) return res.status(400).json({ erro: built.error });
    const [data, dash] = await Promise.all([
      prisma.lancamentoFinanceiro.findMany({
        where: built.where,
        include: lancamentoInclude,
        orderBy: { vencimento: "desc" },
        take: 500,
      }),
      prisma.lancamentoFinanceiro.aggregate({
        where: { ...empresaScope(req), ativo: true, tipo: "A_RECEBER", status: { in: ["ABERTO", "ATRASADO", "PARCIAL"] } },
        _sum: { valor: true },
      }),
    ]);
    const aPagar = await prisma.lancamentoFinanceiro.aggregate({
      where: { ...empresaScope(req), ativo: true, tipo: "A_PAGAR", status: { in: ["ABERTO", "ATRASADO", "PARCIAL"] } },
      _sum: { valor: true },
    });
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const [recebidoMes, pagoMes] = await Promise.all([
      prisma.lancamentoFinanceiro.aggregate({
        where: {
          ...empresaScope(req), ativo: true, tipo: "A_RECEBER", status: "LIQUIDADO",
          dataPagamento: { gte: inicioMes },
        },
        _sum: { valorPago: true },
      }),
      prisma.lancamentoFinanceiro.aggregate({
        where: {
          ...empresaScope(req), ativo: true, tipo: "A_PAGAR", status: "LIQUIDADO",
          dataPagamento: { gte: inicioMes },
        },
        _sum: { valorPago: true },
      }),
    ]);
    buildFinanceiroPdf(data, {
      aReceber: dash._sum.valor || 0,
      aPagar: aPagar._sum.valor || 0,
      recebidoMes: recebidoMes._sum.valorPago || 0,
      pagoMes: pagoMes._sum.valorPago || 0,
    }, res);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao exportar PDF");
  }
}
