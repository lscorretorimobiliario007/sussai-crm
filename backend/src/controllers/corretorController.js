import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import multer from "multer";
import prisma from "../config/prisma.js";
import { empresaScope } from "../utils/helpers.js";
import {
  hasInvalidEnum,
  isStrongEnoughPassword,
  normalizeEmail,
  normalizeNumberFields,
  normalizeRelationIds,
  pickFields,
  sendControllerError,
} from "../utils/security.js";
import {
  ALLOWED_IMAGE_TYPES,
  CORRETOR_UPLOAD_ROOT,
  MAX_IMAGE_SIZE,
} from "../config/uploads.js";

const CORRETOR_FIELDS = [
  "nome", "email", "telefone", "creci", "crea", "comissaoPadrao", "metaMensal",
  "statusCorretor", "equipeId", "permissoes", "tipo",
];
const STATUS_CORRETOR = ["ATIVO", "INATIVO", "FERIAS"];
const TIPOS_USUARIO = ["CORRETOR", "GERENTE", "ADMIN"];
const PERMISSOES = ["imoveis", "clientes", "proprietarios", "leads", "agenda", "contratos", "tarefas"];

function parsePositiveInteger(value, fallback, maximum = Number.MAX_SAFE_INTEGER) {
  if (value == null || value === "") return fallback;
  const number = Number(value);
  return Number.isInteger(number) && number > 0 && number <= maximum ? number : null;
}

function sanitizeUsuario(usuario) {
  if (!usuario) return null;
  const { senha, ...safe } = usuario;
  return safe;
}

function listInclude() {
  return {
    equipe: { select: { id: true, nome: true } },
    _count: {
      select: {
        imoveisCorretados: true,
        leads: true,
        contratos: true,
        eventosAgenda: true,
      },
    },
  };
}

async function registrarHistorico(tx, {
  empresaId, usuarioId, autorId, acao, alteracoes = null,
}) {
  return tx.corretorHistorico.create({
    data: { empresaId, usuarioId, autorId, acao, alteracoes },
  });
}

async function indicadoresCorretor(empresaId, usuarioId) {
  const now = new Date();
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
  const fimMes = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [
    usuario,
    captacoes,
    vendasMes,
    contratosAtivos,
    leadsAbertos,
    leadsGanhos,
    leadsPerdidos,
    agendaMes,
  ] = await Promise.all([
    prisma.usuario.findFirst({
      where: { id: usuarioId, empresaId },
      select: { comissaoPadrao: true, metaMensal: true },
    }),
    prisma.imovel.count({
      where: { empresaId, corretorId: usuarioId, ativo: true },
    }),
    prisma.contrato.findMany({
      where: {
        empresaId,
        corretorId: usuarioId,
        tipo: "VENDA",
        status: { in: ["ATIVO", "ENCERRADO"] },
        OR: [
          { dataInicio: { gte: inicioMes, lte: fimMes } },
          { createdAt: { gte: inicioMes, lte: fimMes } },
        ],
      },
      select: { valor: true, comissao: true },
    }),
    prisma.contrato.count({
      where: { empresaId, corretorId: usuarioId, status: "ATIVO" },
    }),
    prisma.lead.count({
      where: {
        empresaId, corretorId: usuarioId, ativo: true,
        status: { notIn: ["FECHADO", "PERDIDO"] },
      },
    }),
    prisma.lead.count({
      where: { empresaId, corretorId: usuarioId, ativo: true, status: "FECHADO" },
    }),
    prisma.lead.count({
      where: { empresaId, corretorId: usuarioId, ativo: true, status: "PERDIDO" },
    }),
    prisma.eventoAgenda.count({
      where: {
        empresaId,
        usuarioId,
        ativo: true,
        dataInicio: { gte: inicioMes, lte: fimMes },
      },
    }),
  ]);

  const valorVendas = vendasMes.reduce((sum, item) => sum + (item.valor || 0), 0);
  const comissaoPrevista = vendasMes.reduce((sum, item) => {
    if (item.comissao != null) return sum + item.comissao;
    return sum + ((item.valor || 0) * ((usuario?.comissaoPadrao || 0) / 100));
  }, 0);
  const fechados = leadsGanhos + leadsPerdidos;
  const conversao = fechados > 0 ? Math.round((leadsGanhos / fechados) * 100) : 0;
  const meta = usuario?.metaMensal || 0;
  const progressoMeta = meta > 0 ? Math.min(100, Math.round((valorVendas / meta) * 100)) : null;

  return {
    captacoes,
    vendasMes: vendasMes.length,
    valorVendasMes: valorVendas,
    comissaoPrevista,
    contratosAtivos,
    leadsAbertos,
    leadsGanhos,
    leadsPerdidos,
    conversao,
    metaMensal: meta,
    progressoMeta,
    agendaMes,
  };
}

export async function listarOpcoesCorretor(req, res) {
  try {
    const equipes = await prisma.corretorEquipe.findMany({
      where: { empresaId: req.usuario.empresaId, ativo: true },
      orderBy: { nome: "asc" },
    });
    return res.json({
      equipes,
      status: STATUS_CORRETOR,
      tipos: TIPOS_USUARIO,
      permissoes: PERMISSOES,
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao carregar opções de corretores");
  }
}

export async function listarEquipes(req, res) {
  try {
    const equipes = await prisma.corretorEquipe.findMany({
      where: { empresaId: req.usuario.empresaId },
      include: { _count: { select: { corretores: true } } },
      orderBy: { nome: "asc" },
    });
    return res.json(equipes);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao listar equipes");
  }
}

export async function criarEquipe(req, res) {
  try {
    if (!["ADMIN", "GERENTE"].includes(req.usuario.tipo)) {
      return res.status(403).json({ erro: "Sem permissão para criar equipes" });
    }
    const nome = typeof req.body.nome === "string" ? req.body.nome.trim() : "";
    if (!nome) return res.status(400).json({ erro: "Nome da equipe é obrigatório" });
    const equipe = await prisma.corretorEquipe.create({
      data: { empresaId: req.usuario.empresaId, nome },
    });
    return res.status(201).json(equipe);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao criar equipe");
  }
}

export async function rankingCorretores(req, res) {
  try {
    const scope = empresaScope(req);
    const corretores = await prisma.usuario.findMany({
      where: {
        ...scope,
        tipo: { in: ["CORRETOR", "GERENTE"] },
        ...(req.usuario.tipo === "CORRETOR" && { id: req.usuario.id }),
      },
      select: {
        id: true, nome: true, fotoUrl: true, creci: true, statusCorretor: true,
        metaMensal: true, comissaoPadrao: true, equipe: { select: { id: true, nome: true } },
      },
      orderBy: { nome: "asc" },
    });

    const ranking = await Promise.all(corretores.map(async (corretor) => {
      const indicadores = await indicadoresCorretor(req.usuario.empresaId, corretor.id);
      return { ...corretor, indicadores };
    }));

    ranking.sort((a, b) => (b.indicadores.valorVendasMes || 0) - (a.indicadores.valorVendasMes || 0));
    return res.json({
      data: ranking.map((item, index) => ({ ...item, posicao: index + 1 })),
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao carregar ranking");
  }
}

export async function dashboardCorretores(req, res) {
  try {
    const scope = empresaScope(req);
    const where = {
      ...scope,
      tipo: { in: ["CORRETOR", "GERENTE"] },
      ...(req.usuario.tipo === "CORRETOR" && { id: req.usuario.id }),
    };
    const [total, ativos, ferias, inativos] = await Promise.all([
      prisma.usuario.count({ where }),
      prisma.usuario.count({ where: { ...where, statusCorretor: "ATIVO", ativo: true } }),
      prisma.usuario.count({ where: { ...where, statusCorretor: "FERIAS" } }),
      prisma.usuario.count({ where: { ...where, statusCorretor: "INATIVO" } }),
    ]);
    const ranking = await rankingData(req);
    const top = ranking[0] || null;
    return res.json({
      resumo: { total, ativos, ferias, inativos },
      destaque: top,
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao carregar dashboard de corretores");
  }
}

async function rankingData(req) {
  const scope = empresaScope(req);
  const corretores = await prisma.usuario.findMany({
    where: {
      ...scope,
      tipo: { in: ["CORRETOR", "GERENTE"] },
      ativo: true,
      ...(req.usuario.tipo === "CORRETOR" && { id: req.usuario.id }),
    },
    select: { id: true, nome: true, fotoUrl: true, metaMensal: true },
  });
  const ranked = await Promise.all(corretores.map(async (corretor) => {
    const indicadores = await indicadoresCorretor(req.usuario.empresaId, corretor.id);
    return { ...corretor, indicadores };
  }));
  ranked.sort((a, b) => (b.indicadores.valorVendasMes || 0) - (a.indicadores.valorVendasMes || 0));
  return ranked;
}

export async function listarCorretores(req, res) {
  try {
    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, 12, 100);
    if (!page || !limit) return res.status(400).json({ erro: "Paginação inválida" });

    const { busca, statusCorretor, equipeId } = req.query;
    if (statusCorretor && !STATUS_CORRETOR.includes(statusCorretor)) {
      return res.status(400).json({ erro: "Status inválido" });
    }
    const parsedEquipe = parsePositiveInteger(equipeId, undefined);
    if (parsedEquipe === null) return res.status(400).json({ erro: "Equipe inválida" });

    const where = {
      ...empresaScope(req),
      tipo: { in: ["CORRETOR", "GERENTE", "ADMIN"] },
      ...(req.usuario.tipo === "CORRETOR" && { id: req.usuario.id }),
      ...(statusCorretor && { statusCorretor }),
      ...(parsedEquipe && { equipeId: parsedEquipe }),
      ...(req.query.ativo === "false" ? { ativo: false } : req.query.ativo === "true" ? { ativo: true } : {}),
      ...(busca && {
        OR: [
          { nome: { contains: busca.trim(), mode: "insensitive" } },
          { email: { contains: busca.trim(), mode: "insensitive" } },
          { creci: { contains: busca.trim(), mode: "insensitive" } },
          { telefone: { contains: busca.trim(), mode: "insensitive" } },
        ],
      }),
    };

    const [rows, total] = await prisma.$transaction([
      prisma.usuario.findMany({
        where,
        include: listInclude(),
        orderBy: { nome: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.usuario.count({ where }),
    ]);

    const data = await Promise.all(rows.map(async (usuario) => {
      const indicadores = await indicadoresCorretor(req.usuario.empresaId, usuario.id);
      return { ...sanitizeUsuario(usuario), indicadores };
    }));

    return res.json({
      data,
      meta: { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) },
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao listar corretores");
  }
}

export async function criarCorretor(req, res) {
  try {
    if (!["ADMIN", "GERENTE"].includes(req.usuario.tipo)) {
      return res.status(403).json({ erro: "Sem permissão para cadastrar corretores" });
    }
    const data = normalizeRelationIds(pickFields(req.body, CORRETOR_FIELDS), ["equipeId"]);
    data.email = normalizeEmail(data.email);
    data.nome = typeof data.nome === "string" ? data.nome.trim() : "";
    data.tipo = data.tipo && TIPOS_USUARIO.includes(data.tipo) ? data.tipo : "CORRETOR";
    if (req.usuario.tipo === "GERENTE" && data.tipo === "ADMIN") {
      return res.status(403).json({ erro: "Gerentes não podem criar administradores" });
    }
    if (!data.nome || !data.email) return res.status(400).json({ erro: "Nome e e-mail são obrigatórios" });
    if (!isStrongEnoughPassword(req.body.senha)) {
      return res.status(400).json({ erro: "Senha deve ter no mínimo 8 caracteres" });
    }
    if (!normalizeNumberFields(data, ["comissaoPadrao", "metaMensal"])) {
      return res.status(400).json({ erro: "Comissão ou meta inválidas" });
    }
    if (hasInvalidEnum(data, "statusCorretor", STATUS_CORRETOR)) {
      return res.status(400).json({ erro: "Status inválido" });
    }
    if (!data.statusCorretor) data.statusCorretor = "ATIVO";
    if (data.comissaoPadrao == null) data.comissaoPadrao = 5;
    if (Object.prototype.hasOwnProperty.call(data, "permissoes")) {
      if (!Array.isArray(data.permissoes) || data.permissoes.some((item) => !PERMISSOES.includes(item))) {
        return res.status(400).json({ erro: "Permissões inválidas" });
      }
    } else {
      data.permissoes = ["imoveis", "clientes", "leads", "agenda", "tarefas"];
    }
    if (data.equipeId) {
      const equipe = await prisma.corretorEquipe.findFirst({
        where: { id: data.equipeId, empresaId: req.usuario.empresaId, ativo: true },
      });
      if (!equipe) return res.status(400).json({ erro: "Equipe inválida" });
    }

    const senha = await bcrypt.hash(req.body.senha, 12);
    const created = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          ...data,
          senha,
          ativo: data.statusCorretor !== "INATIVO",
          empresaId: req.usuario.empresaId,
        },
        include: listInclude(),
      });
      await registrarHistorico(tx, {
        empresaId: req.usuario.empresaId,
        usuarioId: usuario.id,
        autorId: req.usuario.id,
        acao: "CRIADO",
        alteracoes: { nome: usuario.nome, tipo: usuario.tipo },
      });
      return usuario;
    });
    return res.status(201).json(sanitizeUsuario(created));
  } catch (error) {
    return sendControllerError(res, error, "Erro ao cadastrar corretor");
  }
}

export async function buscarCorretor(req, res) {
  try {
    const id = Number(req.params.id);
    if (req.usuario.tipo === "CORRETOR" && req.usuario.id !== id) {
      return res.status(403).json({ erro: "Corretores só podem ver o próprio perfil" });
    }
    const usuario = await prisma.usuario.findFirst({
      where: { id, empresaId: req.usuario.empresaId },
      include: {
        ...listInclude(),
        historicosCorretor: {
          orderBy: { createdAt: "desc" },
          take: 30,
          include: { autor: { select: { id: true, nome: true } } },
        },
        imoveisCorretados: {
          where: { ativo: true },
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true, codigo: true, titulo: true, status: true, cidade: true,
            valorVenda: true, valorAluguel: true,
          },
        },
        leads: {
          where: { ativo: true },
          orderBy: { updatedAt: "desc" },
          take: 20,
          include: { etapa: { select: { id: true, nome: true, cor: true } } },
        },
        eventosAgenda: {
          where: { ativo: true, dataInicio: { gte: new Date() } },
          orderBy: { dataInicio: "asc" },
          take: 15,
        },
      },
    });
    if (!usuario) return res.status(404).json({ erro: "Corretor não encontrado" });
    const indicadores = await indicadoresCorretor(req.usuario.empresaId, usuario.id);
    return res.json({ ...sanitizeUsuario(usuario), indicadores });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao buscar corretor");
  }
}

export async function atualizarCorretor(req, res) {
  try {
    const id = Number(req.params.id);
    if (req.usuario.tipo === "CORRETOR" && req.usuario.id !== id) {
      return res.status(403).json({ erro: "Sem permissão para editar outro corretor" });
    }
    const previous = await prisma.usuario.findFirst({
      where: { id, empresaId: req.usuario.empresaId },
    });
    if (!previous) return res.status(404).json({ erro: "Corretor não encontrado" });

    const data = normalizeRelationIds(pickFields(req.body, CORRETOR_FIELDS), ["equipeId"]);
    if (data.email) data.email = normalizeEmail(data.email);
    if (data.nome) data.nome = String(data.nome).trim();
    if (req.usuario.tipo === "CORRETOR") {
      delete data.tipo;
      delete data.permissoes;
      delete data.comissaoPadrao;
      delete data.metaMensal;
      delete data.statusCorretor;
      delete data.equipeId;
    }
    if (data.tipo && !TIPOS_USUARIO.includes(data.tipo)) {
      return res.status(400).json({ erro: "Tipo inválido" });
    }
    if (req.usuario.tipo === "GERENTE" && data.tipo === "ADMIN") {
      return res.status(403).json({ erro: "Gerentes não podem promover administradores" });
    }
    if (req.usuario.tipo === "GERENTE" && previous.tipo === "ADMIN") {
      return res.status(403).json({ erro: "Gerentes não podem editar administradores" });
    }
    if (!normalizeNumberFields(data, ["comissaoPadrao", "metaMensal"])) {
      return res.status(400).json({ erro: "Comissão ou meta inválidas" });
    }
    if (hasInvalidEnum(data, "statusCorretor", STATUS_CORRETOR)) {
      return res.status(400).json({ erro: "Status inválido" });
    }
    if (Object.prototype.hasOwnProperty.call(data, "permissoes")) {
      if (!Array.isArray(data.permissoes) || data.permissoes.some((item) => !PERMISSOES.includes(item))) {
        return res.status(400).json({ erro: "Permissões inválidas" });
      }
    }
    if (data.statusCorretor) {
      data.ativo = data.statusCorretor !== "INATIVO";
    }
    if (req.body.senha) {
      if (!isStrongEnoughPassword(req.body.senha)) {
        return res.status(400).json({ erro: "Senha deve ter no mínimo 8 caracteres" });
      }
      data.senha = await bcrypt.hash(req.body.senha, 12);
    }

    let acao = "ATUALIZADO";
    if (data.statusCorretor && data.statusCorretor !== previous.statusCorretor) acao = "STATUS_ALTERADO";
    if (data.metaMensal != null && data.metaMensal !== previous.metaMensal) acao = "META_ATUALIZADA";
    if (data.equipeId !== undefined && data.equipeId !== previous.equipeId) acao = "EQUIPE_ALTERADA";

    const updated = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.update({
        where: { id: previous.id },
        data,
        include: listInclude(),
      });
      await registrarHistorico(tx, {
        empresaId: req.usuario.empresaId,
        usuarioId: previous.id,
        autorId: req.usuario.id,
        acao,
        alteracoes: data.senha ? { ...data, senha: "[alterada]" } : data,
      });
      return usuario;
    });
    return res.json(sanitizeUsuario(updated));
  } catch (error) {
    return sendControllerError(res, error, "Erro ao atualizar corretor");
  }
}

const fotoStorage = multer.diskStorage({
  destination(req, file, callback) {
    const directory = path.join(CORRETOR_UPLOAD_ROOT, String(req.usuario.empresaId), String(req.params.id));
    fs.mkdirSync(directory, { recursive: true });
    callback(null, directory);
  },
  filename(req, file, callback) {
    callback(null, `${randomUUID()}${ALLOWED_IMAGE_TYPES.get(file.mimetype)}`);
  },
});

export const uploadCorretorFoto = multer({
  storage: fotoStorage,
  limits: { files: 1, fileSize: MAX_IMAGE_SIZE },
  fileFilter(req, file, callback) {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      return callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
    }
    return callback(null, true);
  },
}).single("foto");

export async function uploadFotoCorretor(req, res) {
  try {
    const id = Number(req.params.id);
    if (req.usuario.tipo === "CORRETOR" && req.usuario.id !== id) {
      return res.status(403).json({ erro: "Sem permissão" });
    }
    if (!req.file) return res.status(400).json({ erro: "Selecione uma foto" });
    const previous = await prisma.usuario.findFirst({
      where: { id, empresaId: req.usuario.empresaId },
      select: { id: true, fotoArquivo: true },
    });
    if (!previous) return res.status(404).json({ erro: "Corretor não encontrado" });

    const updated = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.update({
        where: { id },
        data: {
          fotoArquivo: req.file.filename,
          fotoUrl: `/corretores/${id}/foto/arquivo`,
        },
        include: listInclude(),
      });
      await registrarHistorico(tx, {
        empresaId: req.usuario.empresaId,
        usuarioId: id,
        autorId: req.usuario.id,
        acao: "FOTO_ATUALIZADA",
      });
      return usuario;
    });

    if (previous.fotoArquivo) {
      const oldPath = path.join(
        CORRETOR_UPLOAD_ROOT,
        String(req.usuario.empresaId),
        String(id),
        previous.fotoArquivo,
      );
      fs.promises.unlink(oldPath).catch(() => {});
    }
    return res.json(sanitizeUsuario(updated));
  } catch (error) {
    if (req.file?.path) fs.promises.unlink(req.file.path).catch(() => {});
    return sendControllerError(res, error, "Erro ao enviar foto");
  }
}

export async function obterFotoCorretor(req, res, next) {
  try {
    const id = Number(req.params.id);
    const usuario = await prisma.usuario.findFirst({
      where: { id, empresaId: req.usuario.empresaId },
      select: { fotoArquivo: true },
    });
    if (!usuario?.fotoArquivo) return res.status(404).json({ erro: "Foto não encontrada" });
    const filePath = path.join(
      CORRETOR_UPLOAD_ROOT,
      String(req.usuario.empresaId),
      String(id),
      path.basename(usuario.fotoArquivo),
    );
    res.setHeader("Cache-Control", "private, max-age=3600");
    return res.sendFile(filePath, (error) => {
      if (error && !res.headersSent) next(error);
    });
  } catch (error) {
    return next(error);
  }
}
