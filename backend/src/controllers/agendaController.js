import prisma from "../config/prisma.js";
import { empresaScope, ownershipScope } from "../utils/helpers.js";
import {
  belongsToEmpresa,
  hasInvalidEnum,
  normalizeIntegerFields,
  normalizeRelationIds,
  pickFields,
  sendControllerError,
} from "../utils/security.js";

const EVENTO_FIELDS = [
  "usuarioId", "clienteId", "imovelId", "leadId", "titulo", "descricao", "tipo", "status",
  "dataInicio", "dataFim", "diaInteiro", "localizacao", "repeticao", "repeticaoAte", "lembreteMinutos",
];

const TIPOS = ["VISITA", "REUNIAO", "LIGACAO", "TAREFA"];
const STATUS = ["AGENDADO", "CONFIRMADO", "CONCLUIDO", "CANCELADO"];
const REPETICOES = ["NENHUMA", "DIARIA", "SEMANAL", "QUINZENAL", "MENSAL"];
const LEMBRETES = [0, 5, 10, 15, 30, 60, 120, 1440];
const MAX_OCORRENCIAS = 52;

function parsePositiveInteger(value, fallback, maximum = Number.MAX_SAFE_INTEGER) {
  if (value == null || value === "") return fallback;
  const number = Number(value);
  return Number.isInteger(number) && number > 0 && number <= maximum ? number : null;
}

function parseDateTime(value) {
  if (value == null || value === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addRecurrence(date, frequencia) {
  const next = new Date(date);
  if (frequencia === "DIARIA") next.setDate(next.getDate() + 1);
  else if (frequencia === "SEMANAL") next.setDate(next.getDate() + 7);
  else if (frequencia === "QUINZENAL") next.setDate(next.getDate() + 14);
  else if (frequencia === "MENSAL") next.setMonth(next.getMonth() + 1);
  return next;
}

function eventInclude() {
  return {
    usuario: { select: { id: true, nome: true, email: true } },
    criadoPor: { select: { id: true, nome: true } },
    cliente: { select: { id: true, nome: true, telefone: true } },
    imovel: { select: { id: true, codigo: true, titulo: true, cidade: true, bairro: true } },
    lead: { select: { id: true, titulo: true, status: true } },
  };
}

function buildChanges(previous, data) {
  const changes = {};
  for (const [field, value] of Object.entries(data)) {
    if (JSON.stringify(previous[field]) !== JSON.stringify(value)) {
      changes[field] = { anterior: previous[field] ?? null, atual: value ?? null };
    }
  }
  return changes;
}

function validateEventoData(data, { partial = false } = {}) {
  if (typeof data.titulo === "string") data.titulo = data.titulo.trim();
  if (typeof data.descricao === "string") data.descricao = data.descricao.trim() || null;
  if (typeof data.localizacao === "string") data.localizacao = data.localizacao.trim() || null;
  if (typeof data.diaInteiro === "boolean" || data.diaInteiro === "true" || data.diaInteiro === "false") {
    data.diaInteiro = data.diaInteiro === true || data.diaInteiro === "true";
  }

  if (hasInvalidEnum(data, "tipo", TIPOS)) return "Tipo de compromisso inválido";
  if (hasInvalidEnum(data, "status", STATUS)) return "Status inválido";
  if (hasInvalidEnum(data, "repeticao", REPETICOES)) return "Repetição inválida";
  if (!partial && !data.titulo) return "Título é obrigatório";
  if (data.titulo && data.titulo.length > 180) return "O título deve ter no máximo 180 caracteres";
  if (!partial && !data.tipo) return "Tipo é obrigatório";

  if (Object.prototype.hasOwnProperty.call(data, "dataInicio")) {
    data.dataInicio = parseDateTime(data.dataInicio);
    if (!data.dataInicio) return "Data de início inválida";
  }
  if (Object.prototype.hasOwnProperty.call(data, "dataFim")) {
    data.dataFim = parseDateTime(data.dataFim);
    if (!data.dataFim) return "Data de fim inválida";
  }
  if (Object.prototype.hasOwnProperty.call(data, "repeticaoAte") && data.repeticaoAte) {
    data.repeticaoAte = parseDateTime(data.repeticaoAte);
    if (!data.repeticaoAte) return "Data limite da repetição inválida";
  } else if (Object.prototype.hasOwnProperty.call(data, "repeticaoAte")) {
    data.repeticaoAte = null;
  }

  if (!normalizeIntegerFields(data, ["lembreteMinutos"])) return "Lembrete inválido";
  if (
    data.lembreteMinutos != null
    && !LEMBRETES.includes(data.lembreteMinutos)
  ) return "Lembrete deve ser 0, 5, 10, 15, 30, 60, 120 ou 1440 minutos";

  if (data.dataInicio && data.dataFim && data.dataFim < data.dataInicio) {
    return "A data de fim deve ser igual ou posterior ao início";
  }
  if (!partial && (!data.dataInicio || !data.dataFim)) {
    return "Informe início e fim do compromisso";
  }
  return null;
}

async function validateRelations(data, empresaId) {
  if (!(await belongsToEmpresa(prisma, "usuario", data.usuarioId, empresaId))) return "Corretor inválido";
  if (!(await belongsToEmpresa(prisma, "cliente", data.clienteId, empresaId))) return "Cliente inválido";
  if (!(await belongsToEmpresa(prisma, "imovel", data.imovelId, empresaId))) return "Imóvel inválido";
  if (!(await belongsToEmpresa(prisma, "lead", data.leadId, empresaId))) return "Lead inválido";
  return null;
}

async function registrarHistorico(tx, {
  empresaId, eventoId, usuarioId, acao, alteracoes = null,
}) {
  return tx.agendaHistorico.create({
    data: { empresaId, eventoId, usuarioId, acao, alteracoes },
  });
}

async function syncVisitaCliente(tx, evento, usuarioId) {
  if (evento.tipo !== "VISITA" || !evento.clienteId || !evento.imovelId) return null;
  return tx.clienteVisita.create({
    data: {
      empresaId: evento.empresaId,
      clienteId: evento.clienteId,
      imovelId: evento.imovelId,
      usuarioId,
      dataHora: evento.dataInicio,
      status: evento.status === "CONCLUIDO" ? "REALIZADA" : evento.status === "CANCELADO" ? "CANCELADA" : "AGENDADA",
      observacoes: evento.descricao || `Agenda: ${evento.titulo}`,
    },
  });
}

function buildOccurrences(base) {
  if (!base.repeticao || base.repeticao === "NENHUMA") return [base];
  const occurrences = [];
  const duration = base.dataFim.getTime() - base.dataInicio.getTime();
  let cursorStart = new Date(base.dataInicio);
  let cursorEnd = new Date(base.dataFim);
  const limit = base.repeticaoAte || addRecurrence(base.dataInicio, "MENSAL");
  // default horizon when no repeticaoAte: 3 months worth via MAX_OCORRENCIAS
  const hardLimit = base.repeticaoAte || (() => {
    const d = new Date(base.dataInicio);
    d.setMonth(d.getMonth() + 6);
    return d;
  })();

  for (let i = 0; i < MAX_OCORRENCIAS; i += 1) {
    if (cursorStart > hardLimit || (limit && cursorStart > limit)) break;
    occurrences.push({
      ...base,
      dataInicio: new Date(cursorStart),
      dataFim: new Date(cursorEnd),
      repeticao: i === 0 ? base.repeticao : "NENHUMA",
      repeticaoAte: i === 0 ? base.repeticaoAte : null,
    });
    cursorStart = addRecurrence(cursorStart, base.repeticao);
    cursorEnd = new Date(cursorStart.getTime() + duration);
  }
  return occurrences.length ? occurrences : [base];
}

export async function listarOpcoesAgenda(req, res) {
  try {
    const scope = empresaScope(req);
    const [corretores, clientes, imoveis, leads] = await Promise.all([
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
      prisma.lead.findMany({
        where: {
          ...scope,
          ...(req.usuario.tipo === "CORRETOR" && { corretorId: req.usuario.id }),
        },
        select: { id: true, titulo: true, status: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);
    return res.json({
      corretores,
      clientes,
      imoveis,
      leads,
      tipos: TIPOS,
      status: STATUS,
      repeticoes: REPETICOES,
      lembretes: LEMBRETES,
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao carregar opções da agenda");
  }
}

export async function dashboardAgenda(req, res) {
  try {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const endOfWeek = new Date(startOfDay);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    const scope = { ...ownershipScope(req, "usuarioId"), ativo: true };

    const [hoje, semana, agendados, concluidos, cancelados, porTipo, proximos] = await Promise.all([
      prisma.eventoAgenda.count({
        where: { ...scope, status: { in: ["AGENDADO", "CONFIRMADO"] }, dataInicio: { gte: startOfDay, lte: endOfDay } },
      }),
      prisma.eventoAgenda.count({
        where: { ...scope, status: { in: ["AGENDADO", "CONFIRMADO"] }, dataInicio: { gte: startOfDay, lte: endOfWeek } },
      }),
      prisma.eventoAgenda.count({ where: { ...scope, status: { in: ["AGENDADO", "CONFIRMADO"] } } }),
      prisma.eventoAgenda.count({ where: { ...scope, status: "CONCLUIDO" } }),
      prisma.eventoAgenda.count({ where: { ...scope, status: "CANCELADO" } }),
      prisma.eventoAgenda.groupBy({
        by: ["tipo"],
        where: { ...scope, status: { in: ["AGENDADO", "CONFIRMADO"] } },
        _count: { _all: true },
      }),
      prisma.eventoAgenda.findMany({
        where: {
          ...scope,
          status: { in: ["AGENDADO", "CONFIRMADO"] },
          dataInicio: { gte: now },
        },
        include: eventInclude(),
        orderBy: { dataInicio: "asc" },
        take: 8,
      }),
    ]);

    return res.json({
      resumo: {
        hoje,
        semana,
        agendados,
        concluidos,
        cancelados,
        porTipo: Object.fromEntries(porTipo.map((item) => [item.tipo, item._count._all])),
      },
      proximos,
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao carregar dashboard da agenda");
  }
}

export async function listarEventos(req, res) {
  try {
    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, 100, 500);
    if (!page || !limit) return res.status(400).json({ erro: "Paginação inválida" });

    const {
      busca, tipo, status, usuarioId: usuarioFiltro, clienteId, imovelId, modo = "calendario",
    } = req.query;
    if (tipo && !TIPOS.includes(tipo)) return res.status(400).json({ erro: "Tipo inválido" });
    if (status && !STATUS.includes(status)) return res.status(400).json({ erro: "Status inválido" });

    const parsedUsuario = parsePositiveInteger(usuarioFiltro, undefined);
    const parsedCliente = parsePositiveInteger(clienteId, undefined);
    const parsedImovel = parsePositiveInteger(imovelId, undefined);
    if ([parsedUsuario, parsedCliente, parsedImovel].includes(null)) {
      return res.status(400).json({ erro: "Filtros inválidos" });
    }
    if (req.usuario.tipo === "CORRETOR" && parsedUsuario && parsedUsuario !== req.usuario.id) {
      return res.status(403).json({ erro: "Corretores só podem consultar a própria agenda" });
    }

    const inicio = parseDateTime(req.query.inicio);
    const fim = parseDateTime(req.query.fim);
    if ((req.query.inicio && !inicio) || (req.query.fim && !fim)) {
      return res.status(400).json({ erro: "Intervalo de datas inválido" });
    }

    const where = {
      ...ownershipScope(req, "usuarioId"),
      ativo: true,
      ...(tipo && { tipo }),
      ...(status && { status }),
      ...(req.usuario.tipo !== "CORRETOR" && parsedUsuario && { usuarioId: parsedUsuario }),
      ...(parsedCliente && { clienteId: parsedCliente }),
      ...(parsedImovel && { imovelId: parsedImovel }),
      ...(inicio && fim && { dataInicio: { gte: inicio, lte: fim } }),
      ...(inicio && !fim && { dataInicio: { gte: inicio } }),
      ...(!inicio && fim && { dataInicio: { lte: fim } }),
      ...(busca && {
        OR: [
          { titulo: { contains: busca.trim(), mode: "insensitive" } },
          { descricao: { contains: busca.trim(), mode: "insensitive" } },
          { localizacao: { contains: busca.trim(), mode: "insensitive" } },
        ],
      }),
    };

    if (modo === "lista") {
      const [data, total] = await prisma.$transaction([
        prisma.eventoAgenda.findMany({
          where,
          include: eventInclude(),
          orderBy: { dataInicio: "asc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.eventoAgenda.count({ where }),
      ]);
      return res.json({
        data,
        meta: { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) },
      });
    }

    const data = await prisma.eventoAgenda.findMany({
      where,
      include: eventInclude(),
      orderBy: { dataInicio: "asc" },
      take: limit,
    });
    return res.json({
      data,
      meta: { page: 1, limit, total: data.length, totalPages: 1 },
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao listar compromissos");
  }
}

export async function listarTimeline(req, res) {
  try {
    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, 20, 100);
    if (!page || !limit) return res.status(400).json({ erro: "Paginação inválida" });

    const eventoIds = await prisma.eventoAgenda.findMany({
      where: { ...ownershipScope(req, "usuarioId"), ativo: true },
      select: { id: true },
    });
    const where = {
      empresaId: req.usuario.empresaId,
      eventoId: { in: eventoIds.map((item) => item.id) },
    };
    const [data, total] = await prisma.$transaction([
      prisma.agendaHistorico.findMany({
        where,
        include: {
          usuario: { select: { id: true, nome: true } },
          evento: { select: { id: true, titulo: true, tipo: true, dataInicio: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.agendaHistorico.count({ where }),
    ]);
    return res.json({
      data,
      meta: { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) },
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao carregar timeline");
  }
}

export async function criarEvento(req, res) {
  try {
    const data = normalizeRelationIds(
      pickFields(req.body, EVENTO_FIELDS),
      ["usuarioId", "clienteId", "imovelId", "leadId"],
    );
    data.usuarioId = req.usuario.tipo === "CORRETOR"
      ? req.usuario.id
      : data.usuarioId ?? req.usuario.id;
    if (!data.status) data.status = "AGENDADO";
    if (!data.repeticao) data.repeticao = "NENHUMA";
    if (data.diaInteiro == null) data.diaInteiro = false;

    const validationError = validateEventoData(data);
    if (validationError) return res.status(400).json({ erro: validationError });
    const relationError = await validateRelations(data, req.usuario.empresaId);
    if (relationError) return res.status(400).json({ erro: relationError });

    const occurrences = buildOccurrences(data);
    const created = await prisma.$transaction(async (tx) => {
      const firstPayload = {
        ...occurrences[0],
        empresaId: req.usuario.empresaId,
        criadoPorId: req.usuario.id,
      };
      const parent = await tx.eventoAgenda.create({
        data: firstPayload,
        include: eventInclude(),
      });
      await registrarHistorico(tx, {
        empresaId: req.usuario.empresaId,
        eventoId: parent.id,
        usuarioId: req.usuario.id,
        acao: "CRIADO",
        alteracoes: { titulo: parent.titulo, tipo: parent.tipo, ocorrencias: occurrences.length },
      });
      await syncVisitaCliente(tx, parent, req.usuario.id);

      for (let i = 1; i < occurrences.length; i += 1) {
        const child = await tx.eventoAgenda.create({
          data: {
            ...occurrences[i],
            empresaId: req.usuario.empresaId,
            criadoPorId: req.usuario.id,
            eventoPaiId: parent.id,
          },
        });
        await registrarHistorico(tx, {
          empresaId: req.usuario.empresaId,
          eventoId: child.id,
          usuarioId: req.usuario.id,
          acao: "CRIADO",
          alteracoes: { serie: parent.id },
        });
      }
      return parent;
    });

    return res.status(201).json(created);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao criar compromisso");
  }
}

export async function buscarEvento(req, res) {
  try {
    const evento = await prisma.eventoAgenda.findFirst({
      where: { id: Number(req.params.id), ...ownershipScope(req, "usuarioId") },
      include: {
        ...eventInclude(),
        historico: {
          orderBy: { createdAt: "desc" },
          take: 30,
          include: { usuario: { select: { id: true, nome: true } } },
        },
        notificacoes: {
          where: { usuarioId: req.usuario.id },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
    if (!evento) return res.status(404).json({ erro: "Compromisso não encontrado" });
    return res.json(evento);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao buscar compromisso");
  }
}

export async function atualizarEvento(req, res) {
  try {
    const previous = await prisma.eventoAgenda.findFirst({
      where: {
        id: Number(req.params.id),
        ativo: true,
        ...ownershipScope(req, "usuarioId"),
      },
    });
    if (!previous) return res.status(404).json({ erro: "Compromisso não encontrado" });
    if (previous.status === "CANCELADO") {
      return res.status(409).json({ erro: "Não é possível editar um compromisso cancelado" });
    }

    const data = normalizeRelationIds(
      pickFields(req.body, EVENTO_FIELDS.filter((field) => field !== "repeticao" && field !== "repeticaoAte")),
      ["usuarioId", "clienteId", "imovelId", "leadId"],
    );
    if (req.usuario.tipo === "CORRETOR") data.usuarioId = req.usuario.id;

    const validationError = validateEventoData(data, { partial: true });
    if (validationError) return res.status(400).json({ erro: validationError });

    const merged = { ...previous, ...data };
    if (merged.dataFim < merged.dataInicio) {
      return res.status(400).json({ erro: "A data de fim deve ser igual ou posterior ao início" });
    }
    const relationError = await validateRelations(data, req.usuario.empresaId);
    if (relationError) return res.status(400).json({ erro: relationError });

    const changes = buildChanges(previous, data);
    const updated = await prisma.$transaction(async (tx) => {
      const evento = await tx.eventoAgenda.update({
        where: { id: previous.id, empresaId: req.usuario.empresaId },
        data,
        include: eventInclude(),
      });
      if (Object.keys(changes).length) {
        await registrarHistorico(tx, {
          empresaId: req.usuario.empresaId,
          eventoId: previous.id,
          usuarioId: req.usuario.id,
          acao: "ATUALIZADO",
          alteracoes: changes,
        });
      }
      return evento;
    });
    return res.json(updated);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao atualizar compromisso");
  }
}

export async function reagendarEvento(req, res) {
  try {
    const previous = await prisma.eventoAgenda.findFirst({
      where: {
        id: Number(req.params.id),
        ativo: true,
        ...ownershipScope(req, "usuarioId"),
      },
    });
    if (!previous) return res.status(404).json({ erro: "Compromisso não encontrado" });
    if (["CANCELADO", "CONCLUIDO"].includes(previous.status)) {
      return res.status(409).json({ erro: "Não é possível reagendar este compromisso" });
    }

    const dataInicio = parseDateTime(req.body.dataInicio);
    const dataFim = parseDateTime(req.body.dataFim);
    if (!dataInicio || !dataFim || dataFim < dataInicio) {
      return res.status(400).json({ erro: "Informe início e fim válidos para reagendar" });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const evento = await tx.eventoAgenda.update({
        where: { id: previous.id, empresaId: req.usuario.empresaId },
        data: { dataInicio, dataFim, notificado: false },
        include: eventInclude(),
      });
      await registrarHistorico(tx, {
        empresaId: req.usuario.empresaId,
        eventoId: previous.id,
        usuarioId: req.usuario.id,
        acao: "REAGENDADO",
        alteracoes: {
          dataInicio: { anterior: previous.dataInicio, atual: dataInicio },
          dataFim: { anterior: previous.dataFim, atual: dataFim },
        },
      });
      return evento;
    });
    return res.json(updated);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao reagendar compromisso");
  }
}

export async function concluirEvento(req, res) {
  try {
    const previous = await prisma.eventoAgenda.findFirst({
      where: {
        id: Number(req.params.id),
        ativo: true,
        ...ownershipScope(req, "usuarioId"),
      },
    });
    if (!previous) return res.status(404).json({ erro: "Compromisso não encontrado" });
    if (previous.status === "CANCELADO") {
      return res.status(409).json({ erro: "Compromisso cancelado não pode ser concluído" });
    }
    if (previous.status === "CONCLUIDO") return res.json(previous);

    const updated = await prisma.$transaction(async (tx) => {
      const evento = await tx.eventoAgenda.update({
        where: { id: previous.id, empresaId: req.usuario.empresaId },
        data: { status: "CONCLUIDO" },
        include: eventInclude(),
      });
      await registrarHistorico(tx, {
        empresaId: req.usuario.empresaId,
        eventoId: previous.id,
        usuarioId: req.usuario.id,
        acao: "CONCLUIDO",
      });
      return evento;
    });
    return res.json(updated);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao concluir compromisso");
  }
}

export async function cancelarEvento(req, res) {
  try {
    const previous = await prisma.eventoAgenda.findFirst({
      where: {
        id: Number(req.params.id),
        ativo: true,
        ...ownershipScope(req, "usuarioId"),
      },
    });
    if (!previous) return res.status(404).json({ erro: "Compromisso não encontrado" });
    if (previous.status === "CANCELADO") {
      return res.json({ mensagem: "Compromisso já cancelado" });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const evento = await tx.eventoAgenda.update({
        where: { id: previous.id, empresaId: req.usuario.empresaId },
        data: { status: "CANCELADO" },
        include: eventInclude(),
      });
      await registrarHistorico(tx, {
        empresaId: req.usuario.empresaId,
        eventoId: previous.id,
        usuarioId: req.usuario.id,
        acao: "CANCELADO",
        alteracoes: { motivo: req.body.motivo?.trim() || null },
      });
      return evento;
    });
    return res.json(updated);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao cancelar compromisso");
  }
}

export async function excluirEvento(req, res) {
  try {
    const previous = await prisma.eventoAgenda.findFirst({
      where: {
        id: Number(req.params.id),
        ativo: true,
        ...ownershipScope(req, "usuarioId"),
      },
    });
    if (!previous) return res.status(404).json({ erro: "Compromisso não encontrado" });

    await prisma.$transaction(async (tx) => {
      await tx.eventoAgenda.update({
        where: { id: previous.id, empresaId: req.usuario.empresaId },
        data: { ativo: false, status: "CANCELADO" },
      });
      await registrarHistorico(tx, {
        empresaId: req.usuario.empresaId,
        eventoId: previous.id,
        usuarioId: req.usuario.id,
        acao: "CANCELADO",
        alteracoes: { softDelete: true },
      });
    });
    return res.json({ mensagem: "Compromisso removido da agenda" });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao remover compromisso");
  }
}

async function gerarLembretesPendentes(req) {
  const now = new Date();
  const eventos = await prisma.eventoAgenda.findMany({
    where: {
      ...ownershipScope(req, "usuarioId"),
      ativo: true,
      notificado: false,
      status: { in: ["AGENDADO", "CONFIRMADO"] },
      lembreteMinutos: { not: null },
      dataInicio: { gte: now },
    },
    take: 100,
  });

  const created = [];
  for (const evento of eventos) {
    const triggerAt = new Date(evento.dataInicio.getTime() - (evento.lembreteMinutos * 60 * 1000));
    if (triggerAt > now) continue;
    const existing = await prisma.agendaNotificacao.findFirst({
      where: {
        empresaId: evento.empresaId,
        eventoId: evento.id,
        usuarioId: evento.usuarioId,
      },
      select: { id: true },
    });
    if (existing) {
      await prisma.eventoAgenda.update({
        where: { id: evento.id },
        data: { notificado: true },
      });
      continue;
    }

    const notification = await prisma.$transaction(async (tx) => {
      const item = await tx.agendaNotificacao.create({
        data: {
          empresaId: evento.empresaId,
          usuarioId: evento.usuarioId,
          eventoId: evento.id,
          titulo: `Lembrete: ${evento.titulo}`,
          mensagem: `Compromisso em ${evento.lembreteMinutos} minuto(s) — ${evento.tipo}`,
        },
      });
      await tx.eventoAgenda.update({
        where: { id: evento.id },
        data: { notificado: true },
      });
      await registrarHistorico(tx, {
        empresaId: evento.empresaId,
        eventoId: evento.id,
        usuarioId: req.usuario.id,
        acao: "LEMBRETE_ENVIADO",
      });
      return item;
    });
    created.push(notification);
  }
  return created;
}

export async function listarNotificacoes(req, res) {
  try {
    await gerarLembretesPendentes(req);
    const apenasNaoLidas = req.query.lidas === "false";
    const data = await prisma.agendaNotificacao.findMany({
      where: {
        empresaId: req.usuario.empresaId,
        usuarioId: req.usuario.id,
        ...(apenasNaoLidas && { lida: false }),
      },
      include: {
        evento: {
          select: {
            id: true, titulo: true, tipo: true, dataInicio: true, status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const naoLidas = data.filter((item) => !item.lida).length;
    return res.json({ data, meta: { naoLidas, total: data.length } });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao listar notificações");
  }
}

export async function marcarNotificacaoLida(req, res) {
  try {
    const notificacao = await prisma.agendaNotificacao.findFirst({
      where: {
        id: Number(req.params.notificacaoId),
        empresaId: req.usuario.empresaId,
        usuarioId: req.usuario.id,
      },
    });
    if (!notificacao) return res.status(404).json({ erro: "Notificação não encontrada" });
    const updated = await prisma.agendaNotificacao.update({
      where: { id: notificacao.id },
      data: { lida: true },
    });
    return res.json(updated);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao marcar notificação");
  }
}

export async function marcarTodasNotificacoesLidas(req, res) {
  try {
    await prisma.agendaNotificacao.updateMany({
      where: {
        empresaId: req.usuario.empresaId,
        usuarioId: req.usuario.id,
        lida: false,
      },
      data: { lida: true },
    });
    return res.json({ mensagem: "Notificações marcadas como lidas" });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao atualizar notificações");
  }
}
