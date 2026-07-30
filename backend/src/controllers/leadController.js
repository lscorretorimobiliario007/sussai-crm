import path from "node:path";
import prisma from "../config/prisma.js";
import { empresaScope, ownershipScope } from "../utils/helpers.js";
import {
  belongsToEmpresa,
  hasInvalidEnum,
  normalizeIntegerFields,
  normalizeNumberFields,
  normalizeRelationIds,
  pickFields,
  sendControllerError,
} from "../utils/security.js";
import { LEAD_UPLOAD_ROOT, MAX_LEAD_ATTACHMENTS } from "../config/uploads.js";
import fs from "node:fs/promises";

const LEAD_FIELDS = [
  "clienteId", "imovelId", "corretorId", "etapaId", "titulo", "status",
  "valor", "valorPrevisto", "probabilidade", "previsaoFechamento",
  "motivoPerda", "origem", "notas",
];

const STATUS_LEAD = ["NOVO", "CONTATO", "VISITA_AGENDADA", "PROPOSTA", "NEGOCIACAO", "FECHADO", "PERDIDO"];
const TIPOS_ETAPA = ["ABERTA", "GANHO", "PERDIDO"];

const DEFAULT_ETAPAS = [
  { nome: "Leads", codigo: "LEAD", ordem: 1, cor: "#64748b", tipo: "ABERTA", probabilidadePadrao: 10 },
  { nome: "Oportunidades", codigo: "OPORTUNIDADE", ordem: 2, cor: "#2563eb", tipo: "ABERTA", probabilidadePadrao: 25 },
  { nome: "Propostas", codigo: "PROPOSTA", ordem: 3, cor: "#d97706", tipo: "ABERTA", probabilidadePadrao: 50 },
  { nome: "Negociações", codigo: "NEGOCIACAO", ordem: 4, cor: "#7c3aed", tipo: "ABERTA", probabilidadePadrao: 75 },
  { nome: "Ganho", codigo: "GANHO", ordem: 5, cor: "#16a34a", tipo: "GANHO", probabilidadePadrao: 100 },
  { nome: "Perdido", codigo: "PERDIDO", ordem: 6, cor: "#dc2626", tipo: "PERDIDO", probabilidadePadrao: 0 },
];

const STATUS_BY_CODIGO = {
  LEAD: "NOVO",
  OPORTUNIDADE: "CONTATO",
  PROPOSTA: "PROPOSTA",
  NEGOCIACAO: "NEGOCIACAO",
  GANHO: "FECHADO",
  PERDIDO: "PERDIDO",
};

function parsePositiveInteger(value, fallback, maximum = Number.MAX_SAFE_INTEGER) {
  if (value == null || value === "") return fallback;
  const number = Number(value);
  return Number.isInteger(number) && number > 0 && number <= maximum ? number : null;
}

function parseDate(value) {
  if (value == null || value === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function listInclude() {
  return {
    etapa: true,
    cliente: { select: { id: true, nome: true, telefone: true, email: true } },
    imovel: { select: { id: true, titulo: true, codigo: true, cidade: true } },
    corretor: { select: { id: true, nome: true } },
    _count: { select: { comentarios: true, anexos: true, tarefas: true, eventosAgenda: true } },
  };
}

function detailInclude() {
  return {
    ...listInclude(),
    historico: {
      orderBy: { createdAt: "desc" },
      take: 40,
      include: { usuario: { select: { id: true, nome: true } } },
    },
    comentarios: {
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { usuario: { select: { id: true, nome: true } } },
    },
    anexos: { orderBy: { createdAt: "desc" } },
    tarefas: {
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { usuario: { select: { id: true, nome: true } } },
    },
    eventosAgenda: {
      where: { ativo: true },
      orderBy: { dataInicio: "asc" },
      take: 20,
      include: { usuario: { select: { id: true, nome: true } } },
    },
  };
}

async function ensureDefaultEtapas(empresaId) {
  const count = await prisma.pipelineEtapa.count({ where: { empresaId } });
  if (count > 0) {
    return prisma.pipelineEtapa.findMany({
      where: { empresaId, ativo: true },
      orderBy: { ordem: "asc" },
    });
  }
  await prisma.pipelineEtapa.createMany({
    data: DEFAULT_ETAPAS.map((etapa) => ({ ...etapa, empresaId })),
  });
  return prisma.pipelineEtapa.findMany({
    where: { empresaId, ativo: true },
    orderBy: { ordem: "asc" },
  });
}

function statusFromEtapa(etapa) {
  if (!etapa) return "NOVO";
  if (etapa.tipo === "GANHO") return "FECHADO";
  if (etapa.tipo === "PERDIDO") return "PERDIDO";
  return STATUS_BY_CODIGO[etapa.codigo] || "NOVO";
}

async function registrarHistorico(tx, {
  empresaId, leadId, usuarioId, acao, alteracoes = null,
}) {
  return tx.leadHistorico.create({
    data: { empresaId, leadId, usuarioId, acao, alteracoes },
  });
}

async function validateRelations(data, empresaId) {
  if (!(await belongsToEmpresa(prisma, "cliente", data.clienteId, empresaId))) return "Cliente inválido";
  if (!(await belongsToEmpresa(prisma, "imovel", data.imovelId, empresaId))) return "Imóvel inválido";
  if (!(await belongsToEmpresa(prisma, "usuario", data.corretorId, empresaId))) return "Corretor inválido";
  if (data.etapaId != null) {
    const etapa = await prisma.pipelineEtapa.findFirst({
      where: { id: data.etapaId, empresaId, ativo: true },
    });
    if (!etapa) return "Etapa inválida";
  }
  return null;
}

function validateLeadData(data, { partial = false } = {}) {
  if (typeof data.titulo === "string") data.titulo = data.titulo.trim();
  if (typeof data.origem === "string") data.origem = data.origem.trim() || null;
  if (typeof data.notas === "string") data.notas = data.notas.trim() || null;
  if (typeof data.motivoPerda === "string") data.motivoPerda = data.motivoPerda.trim() || null;

  if (hasInvalidEnum(data, "status", STATUS_LEAD)) return "Status inválido";
  if (!normalizeNumberFields(data, ["valor", "valorPrevisto"])) return "Valores inválidos";
  if (!normalizeIntegerFields(data, ["probabilidade"])) return "Probabilidade inválida";
  if (data.probabilidade != null && (data.probabilidade < 0 || data.probabilidade > 100)) {
    return "Probabilidade deve estar entre 0 e 100";
  }
  if (Object.prototype.hasOwnProperty.call(data, "previsaoFechamento")) {
    if (data.previsaoFechamento) {
      data.previsaoFechamento = parseDate(data.previsaoFechamento);
      if (!data.previsaoFechamento) return "Previsão de fechamento inválida";
    } else {
      data.previsaoFechamento = null;
    }
  }
  if (!partial && !data.titulo) return "Título é obrigatório";
  if (data.titulo && data.titulo.length > 180) return "Título deve ter no máximo 180 caracteres";
  return null;
}

export async function listarOpcoesLead(req, res) {
  try {
    const scope = empresaScope(req);
    const etapas = await ensureDefaultEtapas(scope.empresaId);
    const [corretores, clientes, imoveis] = await Promise.all([
      prisma.usuario.findMany({
        where: {
          ...scope,
          ativo: true,
          ...(req.usuario.tipo === "CORRETOR" && { id: req.usuario.id }),
        },
        select: { id: true, nome: true, tipo: true },
        orderBy: { nome: "asc" },
      }),
      prisma.cliente.findMany({
        where: { ...ownershipScope(req), ativo: true },
        select: { id: true, nome: true },
        orderBy: { nome: "asc" },
        take: 200,
      }),
      prisma.imovel.findMany({
        where: { ...ownershipScope(req), ativo: true },
        select: { id: true, codigo: true, titulo: true },
        orderBy: { titulo: "asc" },
        take: 200,
      }),
    ]);
    return res.json({
      etapas,
      corretores,
      clientes,
      imoveis,
      status: STATUS_LEAD,
      motivosPerda: [
        "Preço", "Financiamento", "Concorrência", "Desistência",
        "Imóvel inadequado", "Sem retorno", "Outro",
      ],
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao carregar opções do pipeline");
  }
}

export async function listarEtapas(req, res) {
  try {
    const etapas = await ensureDefaultEtapas(req.usuario.empresaId);
    return res.json(etapas);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao listar etapas");
  }
}

export async function criarEtapa(req, res) {
  try {
    if (req.usuario.tipo === "CORRETOR") {
      return res.status(403).json({ erro: "Corretores não podem criar etapas" });
    }
    const nome = typeof req.body.nome === "string" ? req.body.nome.trim() : "";
    const codigo = typeof req.body.codigo === "string"
      ? req.body.codigo.trim().toUpperCase().replace(/\s+/g, "_")
      : "";
    const cor = typeof req.body.cor === "string" ? req.body.cor.trim() : "#2563eb";
    const tipo = req.body.tipo || "ABERTA";
    const probabilidadePadrao = Number(req.body.probabilidadePadrao ?? 10);
    if (!nome || !codigo) return res.status(400).json({ erro: "Nome e código são obrigatórios" });
    if (!TIPOS_ETAPA.includes(tipo)) return res.status(400).json({ erro: "Tipo de etapa inválido" });
    if (!Number.isInteger(probabilidadePadrao) || probabilidadePadrao < 0 || probabilidadePadrao > 100) {
      return res.status(400).json({ erro: "Probabilidade padrão inválida" });
    }
    const maxOrdem = await prisma.pipelineEtapa.aggregate({
      where: { empresaId: req.usuario.empresaId },
      _max: { ordem: true },
    });
    const etapa = await prisma.pipelineEtapa.create({
      data: {
        empresaId: req.usuario.empresaId,
        nome,
        codigo,
        cor,
        tipo,
        probabilidadePadrao,
        ordem: (maxOrdem._max.ordem || 0) + 1,
      },
    });
    return res.status(201).json(etapa);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao criar etapa");
  }
}

export async function atualizarEtapa(req, res) {
  try {
    if (req.usuario.tipo === "CORRETOR") {
      return res.status(403).json({ erro: "Corretores não podem editar etapas" });
    }
    const etapa = await prisma.pipelineEtapa.findFirst({
      where: { id: Number(req.params.etapaId), empresaId: req.usuario.empresaId },
    });
    if (!etapa) return res.status(404).json({ erro: "Etapa não encontrada" });
    const data = {};
    if (req.body.nome != null) data.nome = String(req.body.nome).trim();
    if (req.body.cor != null) data.cor = String(req.body.cor).trim();
    if (req.body.tipo != null) {
      if (!TIPOS_ETAPA.includes(req.body.tipo)) return res.status(400).json({ erro: "Tipo inválido" });
      data.tipo = req.body.tipo;
    }
    if (req.body.probabilidadePadrao != null) {
      const value = Number(req.body.probabilidadePadrao);
      if (!Number.isInteger(value) || value < 0 || value > 100) {
        return res.status(400).json({ erro: "Probabilidade inválida" });
      }
      data.probabilidadePadrao = value;
    }
    if (req.body.ordem != null) {
      const ordem = Number(req.body.ordem);
      if (!Number.isInteger(ordem) || ordem < 1) return res.status(400).json({ erro: "Ordem inválida" });
      data.ordem = ordem;
    }
    if (req.body.ativo != null) data.ativo = Boolean(req.body.ativo);
    const updated = await prisma.pipelineEtapa.update({
      where: { id: etapa.id },
      data,
    });
    return res.json(updated);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao atualizar etapa");
  }
}

export async function reordenarEtapas(req, res) {
  try {
    if (req.usuario.tipo === "CORRETOR") {
      return res.status(403).json({ erro: "Corretores não podem reordenar etapas" });
    }
    const ids = Array.isArray(req.body.etapaIds) ? req.body.etapaIds.map(Number) : [];
    if (!ids.length || ids.some((id) => !Number.isInteger(id) || id <= 0)) {
      return res.status(400).json({ erro: "Lista de etapas inválida" });
    }
    const existing = await prisma.pipelineEtapa.findMany({
      where: { empresaId: req.usuario.empresaId, id: { in: ids } },
      select: { id: true },
    });
    if (existing.length !== ids.length) {
      return res.status(400).json({ erro: "Uma ou mais etapas são inválidas" });
    }
    await prisma.$transaction(ids.map((id, index) => prisma.pipelineEtapa.update({
      where: { id },
      data: { ordem: index + 1 },
    })));
    const etapas = await prisma.pipelineEtapa.findMany({
      where: { empresaId: req.usuario.empresaId, ativo: true },
      orderBy: { ordem: "asc" },
    });
    return res.json(etapas);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao reordenar etapas");
  }
}

export async function dashboardPipeline(req, res) {
  try {
    const scope = ownershipScope(req);
    const etapas = await ensureDefaultEtapas(req.usuario.empresaId);
    const leads = await prisma.lead.findMany({
      where: { ...scope, ativo: true },
      select: {
        id: true, etapaId: true, status: true, valor: true, valorPrevisto: true,
        probabilidade: true, previsaoFechamento: true, updatedAt: true, createdAt: true,
      },
      take: 2000,
    });

    const abertos = leads.filter((lead) => !["FECHADO", "PERDIDO"].includes(lead.status));
    const ganhos = leads.filter((lead) => lead.status === "FECHADO");
    const perdidos = leads.filter((lead) => lead.status === "PERDIDO");
    const valorPipeline = abertos.reduce((sum, lead) => sum + (lead.valorPrevisto ?? lead.valor ?? 0), 0);
    const valorPonderado = abertos.reduce((sum, lead) => {
      const valor = lead.valorPrevisto ?? lead.valor ?? 0;
      return sum + (valor * ((lead.probabilidade ?? 0) / 100));
    }, 0);
    const valorGanho = ganhos.reduce((sum, lead) => sum + (lead.valorPrevisto ?? lead.valor ?? 0), 0);
    const conversao = (ganhos.length + perdidos.length) > 0
      ? Math.round((ganhos.length / (ganhos.length + perdidos.length)) * 100)
      : 0;

    const funil = etapas.map((etapa) => {
      const items = leads.filter((lead) => lead.etapaId === etapa.id);
      return {
        etapaId: etapa.id,
        nome: etapa.nome,
        codigo: etapa.codigo,
        cor: etapa.cor,
        tipo: etapa.tipo,
        quantidade: items.length,
        valor: items.reduce((sum, lead) => sum + (lead.valorPrevisto ?? lead.valor ?? 0), 0),
      };
    });

    const previsaoMes = (() => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return abertos
        .filter((lead) => lead.previsaoFechamento && lead.previsaoFechamento >= start && lead.previsaoFechamento <= end)
        .reduce((sum, lead) => sum + (lead.valorPrevisto ?? lead.valor ?? 0), 0);
    })();

    return res.json({
      resumo: {
        total: leads.length,
        abertos: abertos.length,
        ganhos: ganhos.length,
        perdidos: perdidos.length,
        valorPipeline,
        valorPonderado,
        valorGanho,
        conversao,
        previsaoMes,
      },
      funil,
      etapas,
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao carregar dashboard comercial");
  }
}

export async function criarLead(req, res) {
  try {
    const scope = empresaScope(req);
    await ensureDefaultEtapas(scope.empresaId);
    const data = normalizeRelationIds(
      pickFields(req.body, LEAD_FIELDS),
      ["clienteId", "imovelId", "corretorId", "etapaId"],
    );
    data.corretorId = req.usuario.tipo === "CORRETOR"
      ? req.usuario.id
      : data.corretorId ?? req.usuario.id;

    const validationError = validateLeadData(data);
    if (validationError) return res.status(400).json({ erro: validationError });
    const relationError = await validateRelations(data, scope.empresaId);
    if (relationError) return res.status(400).json({ erro: relationError });

    if (!data.etapaId) {
      const first = await prisma.pipelineEtapa.findFirst({
        where: { empresaId: scope.empresaId, ativo: true, tipo: "ABERTA" },
        orderBy: { ordem: "asc" },
      });
      data.etapaId = first?.id ?? null;
    }
    const etapa = data.etapaId
      ? await prisma.pipelineEtapa.findFirst({ where: { id: data.etapaId, empresaId: scope.empresaId } })
      : null;
    data.status = statusFromEtapa(etapa);
    if (data.probabilidade == null) data.probabilidade = etapa?.probabilidadePadrao ?? 10;
    if (data.valorPrevisto == null && data.valor != null) data.valorPrevisto = data.valor;

    const lead = await prisma.$transaction(async (tx) => {
      const created = await tx.lead.create({
        data: { ...data, ...scope },
        include: listInclude(),
      });
      await registrarHistorico(tx, {
        empresaId: scope.empresaId,
        leadId: created.id,
        usuarioId: req.usuario.id,
        acao: "CRIADO",
        alteracoes: { titulo: created.titulo, etapaId: created.etapaId },
      });
      return created;
    });
    return res.status(201).json(lead);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao criar lead");
  }
}

export async function listarLeads(req, res) {
  try {
    await ensureDefaultEtapas(req.usuario.empresaId);
    const {
      busca, status, etapaId, corretorId, clienteId, imovelId, origem,
    } = req.query;
    const parsedEtapa = parsePositiveInteger(etapaId, undefined);
    const parsedCorretor = parsePositiveInteger(corretorId, undefined);
    const parsedCliente = parsePositiveInteger(clienteId, undefined);
    const parsedImovel = parsePositiveInteger(imovelId, undefined);
    const limit = parsePositiveInteger(req.query.limit, 500, 500);
    if ([parsedEtapa, parsedCorretor, parsedCliente, parsedImovel, limit].includes(null)) {
      return res.status(400).json({ erro: "Filtros inválidos" });
    }
    if (status && !STATUS_LEAD.includes(status)) {
      return res.status(400).json({ erro: "Status inválido" });
    }
    if (req.usuario.tipo === "CORRETOR" && parsedCorretor && parsedCorretor !== req.usuario.id) {
      return res.status(403).json({ erro: "Corretores só podem consultar o próprio pipeline" });
    }

    const where = {
      ...ownershipScope(req),
      ativo: req.query.ativo === "false" ? false : true,
      ...(status && { status }),
      ...(parsedEtapa && { etapaId: parsedEtapa }),
      ...(req.usuario.tipo !== "CORRETOR" && parsedCorretor && { corretorId: parsedCorretor }),
      ...(parsedCliente && { clienteId: parsedCliente }),
      ...(parsedImovel && { imovelId: parsedImovel }),
      ...(origem && { origem: { contains: origem.trim(), mode: "insensitive" } }),
      ...(busca && {
        OR: [
          { titulo: { contains: busca.trim(), mode: "insensitive" } },
          { notas: { contains: busca.trim(), mode: "insensitive" } },
          { origem: { contains: busca.trim(), mode: "insensitive" } },
          { motivoPerda: { contains: busca.trim(), mode: "insensitive" } },
        ],
      }),
    };

    const [etapas, total, data] = await Promise.all([
      prisma.pipelineEtapa.findMany({
        where: { empresaId: req.usuario.empresaId, ativo: true },
        orderBy: { ordem: "asc" },
      }),
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        include: listInclude(),
        orderBy: [{ updatedAt: "desc" }],
        take: limit,
      }),
    ]);

    return res.json({
      data,
      meta: { total, limit, truncated: total > data.length },
      etapas,
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao listar leads");
  }
}

export async function buscarLead(req, res) {
  try {
    const lead = await prisma.lead.findFirst({
      where: { id: Number(req.params.id), ...ownershipScope(req) },
      include: detailInclude(),
    });
    if (!lead) return res.status(404).json({ erro: "Lead não encontrado" });
    return res.json(lead);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao buscar lead");
  }
}

export async function atualizarLead(req, res) {
  try {
    const previous = await prisma.lead.findFirst({
      where: { id: Number(req.params.id), ativo: true, ...ownershipScope(req) },
    });
    if (!previous) return res.status(404).json({ erro: "Lead não encontrado" });

    const data = normalizeRelationIds(
      pickFields(req.body, LEAD_FIELDS),
      ["clienteId", "imovelId", "corretorId", "etapaId"],
    );
    if (req.usuario.tipo === "CORRETOR") data.corretorId = req.usuario.id;
    const validationError = validateLeadData(data, { partial: true });
    if (validationError) return res.status(400).json({ erro: validationError });
    const relationError = await validateRelations(data, req.usuario.empresaId);
    if (relationError) return res.status(400).json({ erro: relationError });

    if (data.etapaId != null && data.etapaId !== previous.etapaId) {
      const etapa = await prisma.pipelineEtapa.findFirst({
        where: { id: data.etapaId, empresaId: req.usuario.empresaId, ativo: true },
      });
      if (!etapa) return res.status(400).json({ erro: "Etapa inválida" });
      data.status = statusFromEtapa(etapa);
      if (data.probabilidade == null) data.probabilidade = etapa.probabilidadePadrao;
      if (etapa.tipo === "PERDIDO" && !data.motivoPerda && !previous.motivoPerda) {
        return res.status(400).json({ erro: "Informe o motivo da perda" });
      }
    }

    const lead = await prisma.$transaction(async (tx) => {
      const updated = await tx.lead.update({
        where: { id: previous.id, empresaId: req.usuario.empresaId },
        data,
        include: listInclude(),
      });
      await registrarHistorico(tx, {
        empresaId: req.usuario.empresaId,
        leadId: previous.id,
        usuarioId: req.usuario.id,
        acao: data.etapaId != null && data.etapaId !== previous.etapaId ? "MOVIDO" : "ATUALIZADO",
        alteracoes: data,
      });
      return updated;
    });
    return res.json(lead);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao atualizar lead");
  }
}

export async function moverLead(req, res) {
  try {
    const previous = await prisma.lead.findFirst({
      where: { id: Number(req.params.id), ativo: true, ...ownershipScope(req) },
      include: { etapa: true },
    });
    if (!previous) return res.status(404).json({ erro: "Lead não encontrado" });

    const etapaId = Number(req.body.etapaId);
    if (!Number.isInteger(etapaId) || etapaId <= 0) {
      return res.status(400).json({ erro: "Etapa de destino inválida" });
    }
    const etapa = await prisma.pipelineEtapa.findFirst({
      where: { id: etapaId, empresaId: req.usuario.empresaId, ativo: true },
    });
    if (!etapa) return res.status(400).json({ erro: "Etapa inválida" });

    const motivoPerda = typeof req.body.motivoPerda === "string" ? req.body.motivoPerda.trim() : null;
    if (etapa.tipo === "PERDIDO" && !motivoPerda && !previous.motivoPerda) {
      return res.status(400).json({ erro: "Informe o motivo da perda para mover para Perdido" });
    }

    const probabilidade = req.body.probabilidade != null
      ? Number(req.body.probabilidade)
      : etapa.probabilidadePadrao;
    if (!Number.isInteger(probabilidade) || probabilidade < 0 || probabilidade > 100) {
      return res.status(400).json({ erro: "Probabilidade inválida" });
    }

    const status = statusFromEtapa(etapa);
    let acao = "MOVIDO";
    if (etapa.tipo === "GANHO") acao = "GANHO";
    if (etapa.tipo === "PERDIDO") acao = "PERDIDO";
    if (previous.etapa?.tipo !== "ABERTA" && etapa.tipo === "ABERTA") acao = "REABERTO";

    const lead = await prisma.$transaction(async (tx) => {
      const updated = await tx.lead.update({
        where: { id: previous.id, empresaId: req.usuario.empresaId },
        data: {
          etapaId: etapa.id,
          status,
          probabilidade,
          ...(etapa.tipo === "PERDIDO" && motivoPerda ? { motivoPerda } : {}),
          ...(etapa.tipo !== "PERDIDO" ? { motivoPerda: null } : {}),
        },
        include: listInclude(),
      });
      await registrarHistorico(tx, {
        empresaId: req.usuario.empresaId,
        leadId: previous.id,
        usuarioId: req.usuario.id,
        acao,
        alteracoes: {
          de: previous.etapaId,
          para: etapa.id,
          deNome: previous.etapa?.nome,
          paraNome: etapa.nome,
          motivoPerda: motivoPerda || null,
        },
      });
      return updated;
    });
    return res.json(lead);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao mover lead");
  }
}

export async function excluirLead(req, res) {
  try {
    const lead = await prisma.lead.findFirst({
      where: { id: Number(req.params.id), ativo: true, ...ownershipScope(req) },
      select: { id: true },
    });
    if (!lead) return res.status(404).json({ erro: "Lead não encontrado" });

    await prisma.$transaction(async (tx) => {
      await tx.lead.update({
        where: { id: lead.id, empresaId: req.usuario.empresaId },
        data: { ativo: false },
      });
      await registrarHistorico(tx, {
        empresaId: req.usuario.empresaId,
        leadId: lead.id,
        usuarioId: req.usuario.id,
        acao: "ATUALIZADO",
        alteracoes: { ativo: false },
      });
    });
    return res.json({ mensagem: "Lead arquivado" });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao arquivar lead");
  }
}

export async function criarComentario(req, res) {
  try {
    const lead = await prisma.lead.findFirst({
      where: { id: Number(req.params.id), ativo: true, ...ownershipScope(req) },
      select: { id: true },
    });
    if (!lead) return res.status(404).json({ erro: "Lead não encontrado" });
    const conteudo = typeof req.body.conteudo === "string" ? req.body.conteudo.trim() : "";
    if (!conteudo || conteudo.length > 5000) {
      return res.status(400).json({ erro: "Comentário inválido" });
    }
    const comentario = await prisma.$transaction(async (tx) => {
      const created = await tx.leadComentario.create({
        data: {
          empresaId: req.usuario.empresaId,
          leadId: lead.id,
          usuarioId: req.usuario.id,
          conteudo,
        },
        include: { usuario: { select: { id: true, nome: true } } },
      });
      await registrarHistorico(tx, {
        empresaId: req.usuario.empresaId,
        leadId: lead.id,
        usuarioId: req.usuario.id,
        acao: "COMENTARIO",
      });
      return created;
    });
    return res.status(201).json(comentario);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao comentar");
  }
}

export async function listarHistoricoLead(req, res) {
  try {
    const lead = await prisma.lead.findFirst({
      where: { id: Number(req.params.id), ...ownershipScope(req) },
      select: { id: true },
    });
    if (!lead) return res.status(404).json({ erro: "Lead não encontrado" });
    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, 20, 100);
    if (!page || !limit) return res.status(400).json({ erro: "Paginação inválida" });
    const where = { empresaId: req.usuario.empresaId, leadId: lead.id };
    const [data, total] = await prisma.$transaction([
      prisma.leadHistorico.findMany({
        where,
        include: { usuario: { select: { id: true, nome: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.leadHistorico.count({ where }),
    ]);
    return res.json({
      data,
      meta: { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) },
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao listar histórico");
  }
}

export async function adicionarAnexos(req, res) {
  const uploaded = (req.files || []).map((file) => file.path);
  try {
    const lead = await prisma.lead.findFirst({
      where: { id: Number(req.params.id), ativo: true, ...ownershipScope(req) },
      select: { id: true },
    });
    if (!lead) {
      await Promise.all(uploaded.map((filePath) => fs.unlink(filePath).catch(() => {})));
      return res.status(404).json({ erro: "Lead não encontrado" });
    }
    if (!req.files?.length) return res.status(400).json({ erro: "Selecione ao menos um arquivo" });

    const anexos = await prisma.$transaction(async (tx) => {
      const existing = await tx.leadAnexo.count({
        where: { empresaId: req.usuario.empresaId, leadId: lead.id },
      });
      if (existing + req.files.length > MAX_LEAD_ATTACHMENTS) {
        const error = new Error("Limite");
        error.code = "ATTACH_LIMIT";
        throw error;
      }
      const created = [];
      for (const file of req.files) {
        const doc = await tx.leadAnexo.create({
          data: {
            empresaId: req.usuario.empresaId,
            leadId: lead.id,
            nome: req.body.nome?.trim() || file.originalname || file.filename,
            nomeArquivo: file.filename,
            mimeType: file.mimetype,
            tamanho: file.size,
            url: "",
          },
        });
        created.push(await tx.leadAnexo.update({
          where: { id: doc.id },
          data: { url: `/leads/${lead.id}/anexos/${doc.id}/arquivo` },
        }));
      }
      await registrarHistorico(tx, {
        empresaId: req.usuario.empresaId,
        leadId: lead.id,
        usuarioId: req.usuario.id,
        acao: "ANEXO_ADICIONADO",
        alteracoes: { quantidade: created.length },
      });
      return created;
    });
    return res.status(201).json(anexos);
  } catch (error) {
    await Promise.all(uploaded.map((filePath) => fs.unlink(filePath).catch(() => {})));
    if (error.code === "ATTACH_LIMIT") {
      return res.status(400).json({ erro: `Máximo de ${MAX_LEAD_ATTACHMENTS} anexos por lead` });
    }
    return sendControllerError(res, error, "Erro ao enviar anexos");
  }
}

export async function obterAnexo(req, res, next) {
  try {
    const lead = await prisma.lead.findFirst({
      where: { id: Number(req.params.id), ...ownershipScope(req) },
      select: { id: true },
    });
    if (!lead) return res.status(404).json({ erro: "Lead não encontrado" });
    const anexo = await prisma.leadAnexo.findFirst({
      where: {
        id: Number(req.params.anexoId),
        leadId: lead.id,
        empresaId: req.usuario.empresaId,
      },
    });
    if (!anexo) return res.status(404).json({ erro: "Anexo não encontrado" });
    const filePath = path.join(
      LEAD_UPLOAD_ROOT,
      String(req.usuario.empresaId),
      String(lead.id),
      path.basename(anexo.nomeArquivo),
    );
    return res.sendFile(filePath, (error) => {
      if (error && !res.headersSent) next(error);
    });
  } catch (error) {
    return next(error);
  }
}

export async function excluirAnexo(req, res) {
  try {
    const lead = await prisma.lead.findFirst({
      where: { id: Number(req.params.id), ativo: true, ...ownershipScope(req) },
      select: { id: true },
    });
    if (!lead) return res.status(404).json({ erro: "Lead não encontrado" });
    const anexo = await prisma.leadAnexo.findFirst({
      where: {
        id: Number(req.params.anexoId),
        leadId: lead.id,
        empresaId: req.usuario.empresaId,
      },
    });
    if (!anexo) return res.status(404).json({ erro: "Anexo não encontrado" });

    await prisma.$transaction(async (tx) => {
      await tx.leadAnexo.delete({ where: { id: anexo.id } });
      await registrarHistorico(tx, {
        empresaId: req.usuario.empresaId,
        leadId: lead.id,
        usuarioId: req.usuario.id,
        acao: "ANEXO_REMOVIDO",
        alteracoes: { anexoId: anexo.id, nome: anexo.nome },
      });
    });
    const filePath = path.join(
      LEAD_UPLOAD_ROOT,
      String(req.usuario.empresaId),
      String(lead.id),
      path.basename(anexo.nomeArquivo),
    );
    await fs.unlink(filePath).catch(() => {});
    return res.json({ mensagem: "Anexo removido" });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao remover anexo");
  }
}

export async function criarTarefaLead(req, res) {
  try {
    const lead = await prisma.lead.findFirst({
      where: { id: Number(req.params.id), ativo: true, ...ownershipScope(req) },
      select: { id: true, clienteId: true, corretorId: true, titulo: true },
    });
    if (!lead) return res.status(404).json({ erro: "Lead não encontrado" });
    const titulo = typeof req.body.titulo === "string" ? req.body.titulo.trim() : "";
    if (!titulo) return res.status(400).json({ erro: "Título da tarefa é obrigatório" });
    const tarefa = await prisma.$transaction(async (tx) => {
      const created = await tx.tarefa.create({
        data: {
          empresaId: req.usuario.empresaId,
          usuarioId: req.usuario.tipo === "CORRETOR" ? req.usuario.id : (Number(req.body.usuarioId) || lead.corretorId || req.usuario.id),
          leadId: lead.id,
          clienteId: lead.clienteId,
          titulo,
          descricao: req.body.descricao?.trim() || `Vinculada ao lead: ${lead.titulo}`,
          dataLimite: parseDate(req.body.dataLimite),
          prioridade: ["BAIXA", "MEDIA", "ALTA", "URGENTE"].includes(req.body.prioridade) ? req.body.prioridade : "MEDIA",
        },
        include: { usuario: { select: { id: true, nome: true } } },
      });
      await registrarHistorico(tx, {
        empresaId: req.usuario.empresaId,
        leadId: lead.id,
        usuarioId: req.usuario.id,
        acao: "TAREFA_VINCULADA",
        alteracoes: { tarefaId: created.id },
      });
      return created;
    });
    return res.status(201).json(tarefa);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao criar tarefa vinculada");
  }
}

export async function criarAgendaLead(req, res) {
  try {
    const lead = await prisma.lead.findFirst({
      where: { id: Number(req.params.id), ativo: true, ...ownershipScope(req) },
      select: {
        id: true, clienteId: true, imovelId: true, corretorId: true, titulo: true,
      },
    });
    if (!lead) return res.status(404).json({ erro: "Lead não encontrado" });
    const dataInicio = parseDate(req.body.dataInicio);
    const dataFim = parseDate(req.body.dataFim) || (dataInicio ? new Date(dataInicio.getTime() + 60 * 60 * 1000) : null);
    const tipo = ["VISITA", "REUNIAO", "LIGACAO", "TAREFA"].includes(req.body.tipo) ? req.body.tipo : "VISITA";
    const titulo = typeof req.body.titulo === "string" && req.body.titulo.trim()
      ? req.body.titulo.trim()
      : `${tipo} — ${lead.titulo}`;
    if (!dataInicio || !dataFim) return res.status(400).json({ erro: "Informe data de início e fim" });

    const evento = await prisma.$transaction(async (tx) => {
      const created = await tx.eventoAgenda.create({
        data: {
          empresaId: req.usuario.empresaId,
          usuarioId: req.usuario.tipo === "CORRETOR" ? req.usuario.id : (lead.corretorId || req.usuario.id),
          criadoPorId: req.usuario.id,
          leadId: lead.id,
          clienteId: lead.clienteId,
          imovelId: lead.imovelId,
          titulo,
          descricao: req.body.descricao?.trim() || null,
          tipo,
          dataInicio,
          dataFim,
          lembreteMinutos: req.body.lembreteMinutos != null ? Number(req.body.lembreteMinutos) : 30,
        },
        include: { usuario: { select: { id: true, nome: true } } },
      });
      await registrarHistorico(tx, {
        empresaId: req.usuario.empresaId,
        leadId: lead.id,
        usuarioId: req.usuario.id,
        acao: "AGENDA_VINCULADA",
        alteracoes: { eventoId: created.id, tipo },
      });
      return created;
    });
    return res.status(201).json(evento);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao agendar a partir do lead");
  }
}
