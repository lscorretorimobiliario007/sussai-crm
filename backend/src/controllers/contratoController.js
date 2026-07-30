import prisma from "../config/prisma.js";
import { empresaScope, gerarNumeroContrato, ownershipScope } from "../utils/helpers.js";
import {
  belongsToEmpresa,
  hasInvalidEnum,
  normalizeDateFields,
  normalizeIntegerFields,
  normalizeNumberFields,
  normalizeRelationIds,
  pickFields,
  sendControllerError,
} from "../utils/security.js";

const CONTRATO_FIELDS = [
  "imovelId", "clienteId", "proprietarioId", "corretorId", "numero",
  "tipo", "status", "valor", "comissao", "dataInicio", "dataFim",
  "diaVencimento", "observacoes",
];
const TIPOS_CONTRATO = ["ALUGUEL", "VENDA", "ADMINISTRACAO"];
const STATUS_CONTRATO = ["RASCUNHO", "ATIVO", "ENCERRADO", "CANCELADO"];

function normalizeAndValidateContract(data) {
  return normalizeNumberFields(data, ["valor", "comissao"])
    && normalizeIntegerFields(data, ["diaVencimento"])
    && normalizeDateFields(data, ["dataInicio", "dataFim"])
    && !hasInvalidEnum(data, "tipo", TIPOS_CONTRATO)
    && !hasInvalidEnum(data, "status", STATUS_CONTRATO)
    && (data.diaVencimento == null || (data.diaVencimento >= 1 && data.diaVencimento <= 31));
}

function propertyStatusForContract(tipo) {
  if (tipo === "VENDA") return "VENDIDO";
  if (tipo === "ALUGUEL") return "ALUGADO";
  return null;
}

async function validateRelations(data, empresaId) {
  const relations = [
    ["imovel", data.imovelId],
    ["cliente", data.clienteId],
    ["usuario", data.corretorId],
  ];
  for (const [model, id] of relations) {
    if (!(await belongsToEmpresa(prisma, model, id, empresaId))) return false;
  }
  if (data.proprietarioId != null) {
    const proprietario = await prisma.cliente.findFirst({
      where: {
        id: data.proprietarioId,
        empresaId,
        tipo: "PROPRIETARIO",
        ativo: true,
      },
      select: { id: true },
    });
    if (!proprietario) return false;
  }
  return true;
}

export async function criarContrato(req, res) {
  try {
    const scope = empresaScope(req);
    const numero = req.body.numero || gerarNumeroContrato();
    const data = normalizeRelationIds(
      pickFields(req.body, CONTRATO_FIELDS),
      ["imovelId", "clienteId", "proprietarioId", "corretorId"],
    );
    data.corretorId = req.usuario.tipo === "CORRETOR"
      ? req.usuario.id
      : data.corretorId ?? req.usuario.id;
    if (req.usuario.tipo === "CORRETOR") data.status = "RASCUNHO";

    if (!normalizeAndValidateContract(data)) {
      return res.status(400).json({ erro: "Tipo, status, valores ou datas do contrato são inválidos" });
    }

    if (!data.imovelId || !data.clienteId || !data.tipo || data.valor == null || !data.dataInicio) {
      return res.status(400).json({ erro: "Imóvel, cliente, tipo, valor e data inicial são obrigatórios" });
    }

    if (!(await validateRelations(data, scope.empresaId))) {
      return res.status(400).json({ erro: "Relacionamento inválido para esta empresa" });
    }

    const contrato = await prisma.$transaction(async (tx) => {
      if (data.status === "ATIVO" && propertyStatusForContract(data.tipo)) {
        const conflito = await tx.contrato.findFirst({
          where: {
            empresaId: scope.empresaId,
            imovelId: data.imovelId,
            status: "ATIVO",
            tipo: { in: ["VENDA", "ALUGUEL"] },
          },
          select: { id: true },
        });
        if (conflito) {
          const error = new Error("Imóvel já possui contrato ativo");
          error.code = "P2002";
          throw error;
        }
      }

      const novo = await tx.contrato.create({
        data: {
          ...data,
          ...scope,
          numero,
        },
        include: {
          imovel: { select: { id: true, titulo: true, codigo: true } },
          cliente: { select: { id: true, nome: true } },
          proprietario: { select: { id: true, nome: true } },
          corretor: { select: { id: true, nome: true } },
        },
      });

      if (novo.status === "ATIVO") {
        const statusImovel = propertyStatusForContract(novo.tipo);
        if (statusImovel) {
          await tx.imovel.update({
            where: { id: novo.imovelId, empresaId: scope.empresaId },
            data: { status: statusImovel },
          });
        }
      }

      return novo;
    }, { isolationLevel: "Serializable" });

    return res.status(201).json(contrato);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao criar contrato");
  }
}

export async function listarContratos(req, res) {
  try {
    const { status, tipo } = req.query;
    if (status && !STATUS_CONTRATO.includes(status)) {
      return res.status(400).json({ erro: "Status inválido" });
    }
    if (tipo && !TIPOS_CONTRATO.includes(tipo)) {
      return res.status(400).json({ erro: "Tipo inválido" });
    }
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const where = {
      ...ownershipScope(req),
      ...(status && { status }),
      ...(tipo && { tipo }),
    };
    const [total, contratos] = await prisma.$transaction([
      prisma.contrato.count({ where }),
      prisma.contrato.findMany({
        where,
        include: {
          imovel: { select: { id: true, titulo: true, codigo: true, empresaId: true } },
          cliente: { select: { id: true, nome: true, empresaId: true } },
          corretor: { select: { id: true, nome: true, empresaId: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return res.json({
      data: contratos.map((contrato) => ({
        ...contrato,
        imovel: contrato.imovel?.empresaId === req.usuario.empresaId
          ? { id: contrato.imovel.id, titulo: contrato.imovel.titulo, codigo: contrato.imovel.codigo }
          : null,
        cliente: contrato.cliente?.empresaId === req.usuario.empresaId
          ? { id: contrato.cliente.id, nome: contrato.cliente.nome }
          : null,
        corretor: contrato.corretor?.empresaId === req.usuario.empresaId
          ? { id: contrato.corretor.id, nome: contrato.corretor.nome }
          : null,
      })),
      meta: { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) },
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao listar contratos");
  }
}

export async function buscarContrato(req, res) {
  try {
    const contrato = await prisma.contrato.findFirst({
      where: {
        id: Number(req.params.id),
        ...ownershipScope(req),
      },
      include: {
        imovel: true,
        cliente: true,
        proprietario: true,
        corretor: { select: { id: true, nome: true, empresaId: true } },
        cobrancas: {
          where: { empresaId: req.usuario.empresaId },
          orderBy: { vencimento: "asc" },
        },
      },
    });

    if (!contrato) {
      return res.status(404).json({ erro: "Contrato não encontrado" });
    }

    if (contrato.imovel?.empresaId !== req.usuario.empresaId) contrato.imovel = null;
    if (contrato.cliente?.empresaId !== req.usuario.empresaId) contrato.cliente = null;
    if (contrato.proprietario?.empresaId !== req.usuario.empresaId) contrato.proprietario = null;
    if (contrato.corretor?.empresaId !== req.usuario.empresaId) contrato.corretor = null;

    return res.json(contrato);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao buscar contrato");
  }
}

export async function atualizarContrato(req, res) {
  try {
    const existe = await prisma.contrato.findFirst({
      where: { id: Number(req.params.id), ...ownershipScope(req) },
      select: { id: true, imovelId: true, status: true, tipo: true },
    });
    if (!existe) {
      return res.status(404).json({ erro: "Contrato não encontrado" });
    }

    const data = normalizeRelationIds(
      pickFields(req.body, CONTRATO_FIELDS),
      ["imovelId", "clienteId", "proprietarioId", "corretorId"],
    );
    if (req.usuario.tipo === "CORRETOR") {
      data.corretorId = req.usuario.id;
      if (Object.prototype.hasOwnProperty.call(data, "status")) {
        return res.status(403).json({ erro: "Apenas administradores e gerentes podem alterar o status do contrato" });
      }
    }
    if (!normalizeAndValidateContract(data)) {
      return res.status(400).json({ erro: "Tipo, status, valores ou datas do contrato são inválidos" });
    }
    if (
      (Object.prototype.hasOwnProperty.call(data, "imovelId") && !data.imovelId)
      || (Object.prototype.hasOwnProperty.call(data, "clienteId") && !data.clienteId)
    ) {
      return res.status(400).json({ erro: "Imóvel e cliente não podem ser removidos do contrato" });
    }
    if (!(await validateRelations(data, req.usuario.empresaId))) {
      return res.status(400).json({ erro: "Relacionamento inválido para esta empresa" });
    }

    const contrato = await prisma.$transaction(async (tx) => {
      const atualizado = await tx.contrato.update({
        where: { id: existe.id, ...ownershipScope(req) },
        data,
        include: {
          imovel: { select: { titulo: true } },
          cliente: { select: { nome: true } },
        },
      });

      const statusAnteriorImovel = propertyStatusForContract(existe.tipo);
      const novoStatusImovel = propertyStatusForContract(atualizado.tipo);
      if (atualizado.status === "ATIVO" && novoStatusImovel) {
        const conflito = await tx.contrato.findFirst({
          where: {
            empresaId: req.usuario.empresaId,
            imovelId: atualizado.imovelId,
            status: "ATIVO",
            tipo: { in: ["VENDA", "ALUGUEL"] },
            id: { not: existe.id },
          },
          select: { id: true },
        });
        if (conflito) {
          const error = new Error("Imóvel já possui contrato ativo");
          error.code = "P2002";
          throw error;
        }
      }

      const ocupavaImovel = existe.status === "ATIVO" && statusAnteriorImovel;
      const ocupaImovel = atualizado.status === "ATIVO" && novoStatusImovel;
      if (ocupavaImovel || ocupaImovel) {
        const imoveisAfetados = new Set([existe.imovelId, atualizado.imovelId]);
        for (const imovelId of imoveisAfetados) {
          const contratosAtivos = await tx.contrato.findMany({
            where: {
              empresaId: req.usuario.empresaId,
              imovelId,
              status: "ATIVO",
              tipo: { in: ["VENDA", "ALUGUEL"] },
            },
            select: { tipo: true },
          });
          const status = contratosAtivos.some((item) => item.tipo === "VENDA")
            ? "VENDIDO"
            : contratosAtivos.some((item) => item.tipo === "ALUGUEL")
              ? "ALUGADO"
              : "DISPONIVEL";
          await tx.imovel.update({
            where: { id: imovelId, empresaId: req.usuario.empresaId },
            data: { status },
          });
        }
      }

      return atualizado;
    }, { isolationLevel: "Serializable" });
    return res.json(contrato);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao atualizar contrato");
  }
}
