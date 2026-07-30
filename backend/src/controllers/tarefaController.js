import prisma from "../config/prisma.js";
import { empresaScope, ownershipScope } from "../utils/helpers.js";
import {
  belongsToEmpresa,
  hasInvalidEnum,
  normalizeDateFields,
  normalizeRelationIds,
  pickFields,
  sendControllerError,
} from "../utils/security.js";

const TAREFA_FIELDS = [
  "usuarioId", "leadId", "clienteId", "titulo", "descricao",
  "dataLimite", "prioridade", "status",
];
const PRIORIDADES = ["BAIXA", "MEDIA", "ALTA", "URGENTE"];
const STATUS_TAREFA = ["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"];

function normalizeAndValidateTask(data) {
  return normalizeDateFields(data, ["dataLimite"])
    && !hasInvalidEnum(data, "prioridade", PRIORIDADES)
    && !hasInvalidEnum(data, "status", STATUS_TAREFA);
}

async function validateRelations(data, empresaId) {
  const relations = [
    ["usuario", data.usuarioId],
    ["lead", data.leadId],
    ["cliente", data.clienteId],
  ];
  for (const [model, id] of relations) {
    if (!(await belongsToEmpresa(prisma, model, id, empresaId))) return false;
  }
  return true;
}

function sanitizeTaskRelations(tarefa, empresaId) {
  return {
    ...tarefa,
    usuario: tarefa.usuario?.empresaId === empresaId
      ? { id: tarefa.usuario.id, nome: tarefa.usuario.nome }
      : null,
    lead: tarefa.lead?.empresaId === empresaId
      ? { id: tarefa.lead.id, titulo: tarefa.lead.titulo }
      : null,
    cliente: tarefa.cliente?.empresaId === empresaId
      ? { id: tarefa.cliente.id, nome: tarefa.cliente.nome }
      : null,
  };
}

export async function criarTarefa(req, res) {
  try {
    const scope = empresaScope(req);
    const data = normalizeRelationIds(pickFields(req.body, TAREFA_FIELDS), ["usuarioId", "leadId", "clienteId"]);
    if (!normalizeAndValidateTask(data)) {
      return res.status(400).json({ erro: "Prazo, prioridade ou status da tarefa são inválidos" });
    }

    data.usuarioId = req.usuario.tipo === "CORRETOR"
      ? req.usuario.id
      : data.usuarioId ?? req.usuario.id;
    if (!data.titulo) {
      return res.status(400).json({ erro: "Título da tarefa é obrigatório" });
    }
    if (!(await validateRelations(data, scope.empresaId))) {
      return res.status(400).json({ erro: "Relacionamento inválido para esta empresa" });
    }

    const tarefa = await prisma.tarefa.create({
      data: {
        ...data,
        ...scope,
      },
      include: {
        usuario: { select: { id: true, nome: true, empresaId: true } },
        lead: { select: { id: true, titulo: true, empresaId: true } },
        cliente: { select: { id: true, nome: true, empresaId: true } },
      },
    });
    return res.status(201).json(sanitizeTaskRelations(tarefa, scope.empresaId));
  } catch (error) {
    return sendControllerError(res, error, "Erro ao criar tarefa");
  }
}

export async function listarTarefas(req, res) {
  try {
    const { status, prioridade } = req.query;
    if (status && !STATUS_TAREFA.includes(status)) {
      return res.status(400).json({ erro: "Status inválido" });
    }
    if (prioridade && !PRIORIDADES.includes(prioridade)) {
      return res.status(400).json({ erro: "Prioridade inválida" });
    }
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const where = {
      ...ownershipScope(req, "usuarioId"),
      ...(status && { status }),
      ...(prioridade && { prioridade }),
    };
    const [total, tarefas] = await prisma.$transaction([
      prisma.tarefa.count({ where }),
      prisma.tarefa.findMany({
        where,
        include: {
          usuario: { select: { id: true, nome: true, empresaId: true } },
          lead: { select: { id: true, titulo: true, empresaId: true } },
          cliente: { select: { id: true, nome: true, empresaId: true } },
        },
        orderBy: [{ prioridade: "desc" }, { dataLimite: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return res.json({
      data: tarefas.map((tarefa) => sanitizeTaskRelations(tarefa, req.usuario.empresaId)),
      meta: { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) },
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao listar tarefas");
  }
}

export async function atualizarTarefa(req, res) {
  try {
    const existe = await prisma.tarefa.findFirst({
      where: { id: Number(req.params.id), ...ownershipScope(req, "usuarioId") },
      select: { id: true },
    });
    if (!existe) {
      return res.status(404).json({ erro: "Tarefa não encontrada" });
    }

    const data = normalizeRelationIds(pickFields(req.body, TAREFA_FIELDS), ["usuarioId", "leadId", "clienteId"]);
    if (req.usuario.tipo === "CORRETOR") data.usuarioId = req.usuario.id;
    if (!normalizeAndValidateTask(data)) {
      return res.status(400).json({ erro: "Prazo, prioridade ou status da tarefa são inválidos" });
    }
    if (!(await validateRelations(data, req.usuario.empresaId))) {
      return res.status(400).json({ erro: "Relacionamento inválido para esta empresa" });
    }

    const tarefa = await prisma.tarefa.update({
      where: { id: existe.id, ...ownershipScope(req, "usuarioId") },
      data,
      include: {
        usuario: { select: { id: true, nome: true, empresaId: true } },
        lead: { select: { id: true, titulo: true, empresaId: true } },
        cliente: { select: { id: true, nome: true, empresaId: true } },
      },
    });
    return res.json(sanitizeTaskRelations(tarefa, req.usuario.empresaId));
  } catch (error) {
    return sendControllerError(res, error, "Erro ao atualizar tarefa");
  }
}

export async function excluirTarefa(req, res) {
  try {
    const tarefa = await prisma.tarefa.findFirst({
      where: { id: Number(req.params.id), ...ownershipScope(req, "usuarioId") },
      select: { id: true },
    });
    if (!tarefa) {
      return res.status(404).json({ erro: "Tarefa não encontrada" });
    }

    await prisma.tarefa.delete({ where: { id: tarefa.id, ...ownershipScope(req, "usuarioId") } });
    return res.json({ mensagem: "Tarefa removida" });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao excluir tarefa");
  }
}
