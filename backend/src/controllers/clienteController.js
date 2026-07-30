import { randomUUID } from "node:crypto";
import prisma from "../config/prisma.js";
import { empresaScope, ownershipScope } from "../utils/helpers.js";
import {
  belongsToEmpresa,
  hasInvalidEnum,
  normalizeNumberFields,
  normalizeRelationIds,
  pickFields,
  sendControllerError,
} from "../utils/security.js";
import { clientFilePath, removeFiles } from "../services/clienteStorage.js";
import { buildClientePdf, buildClientesExcel } from "../services/clienteExport.js";
import { MAX_CLIENT_DOCUMENTS } from "../config/uploads.js";

const CLIENTE_FIELDS = [
  "tipo", "tipoPessoa", "status", "nome", "razaoSocial", "nomeFantasia",
  "cpfCnpj", "email", "telefone", "whatsapp", "endereco", "cidade", "estado",
  "notas", "origem", "interesses", "faixaPrecoMin", "faixaPrecoMax",
  "cidadesInteresse", "tags", "corretorId",
];
const TIPOS_CLIENTE = ["PROPRIETARIO", "INQUILINO", "COMPRADOR", "LEAD"];
const TIPOS_PESSOA = ["PF", "PJ"];
const STATUS_CLIENTE = ["PROSPECTO", "QUALIFICADO", "NEGOCIACAO", "CLIENTE", "INATIVO", "PERDIDO"];
const INTERESSES = ["COMPRA", "VENDA", "LOCACAO", "ADMINISTRACAO"];
const TIPOS_CONTATO = ["CELULAR", "COMERCIAL", "RESIDENCIAL", "WHATSAPP", "OUTRO"];
const TIPOS_ENDERECO = ["RESIDENCIAL", "COMERCIAL", "COBRANCA", "OUTRO"];
const TIPOS_DOCUMENTO = ["CPF", "CNPJ", "RG", "COMPROVANTE_RESIDENCIA", "CONTRATO", "OUTRO"];
const TIPOS_INTERACAO = ["LIGACAO", "EMAIL", "WHATSAPP", "VISITA", "REUNIAO", "OUTRO"];
const STATUS_VISITA = ["AGENDADA", "REALIZADA", "CANCELADA", "NAO_COMPARECEU"];
const STATUS_PROPOSTA = ["RASCUNHO", "ENVIADA", "EM_ANALISE", "ACEITA", "RECUSADA", "CANCELADA"];

function parsePositiveInteger(value, fallback, maximum = Number.MAX_SAFE_INTEGER) {
  if (value == null || value === "") return fallback;
  const number = Number(value);
  return Number.isInteger(number) && number > 0 && number <= maximum ? number : null;
}

function parseOptionalNumber(value) {
  if (value == null || value === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function normalizeText(data) {
  for (const [field, value] of Object.entries(data)) {
    if (typeof value === "string") data[field] = value.trim();
  }
  if (typeof data.cpfCnpj === "string") data.cpfCnpj = data.cpfCnpj.replace(/\D/g, "");
  if (typeof data.estado === "string") data.estado = data.estado.toUpperCase();
  if (typeof data.email === "string") data.email = data.email.toLowerCase();
}

function normalizeStringArray(value, { max = 30, upper = false } = {}) {
  if (value == null) return undefined;
  if (!Array.isArray(value)) return null;
  if (value.length > max) return null;
  if (value.some((item) => typeof item !== "string" || !item.trim())) return null;
  const normalized = [...new Set(value.map((item) => (upper ? item.trim().toUpperCase() : item.trim())))];
  return normalized;
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

function validateClienteData(data, { partial = false } = {}) {
  normalizeText(data);
  if (
    hasInvalidEnum(data, "tipo", TIPOS_CLIENTE)
    || hasInvalidEnum(data, "tipoPessoa", TIPOS_PESSOA)
    || hasInvalidEnum(data, "status", STATUS_CLIENTE)
  ) return "Tipo, pessoa ou status inválidos";

  if (!normalizeNumberFields(data, ["faixaPrecoMin", "faixaPrecoMax"])) {
    return "Faixa de preço inválida";
  }
  if (!partial && !data.nome) return "Nome do cliente é obrigatório";
  if (data.nome && data.nome.length > 160) return "O nome deve ter no máximo 160 caracteres";
  if (data.estado && !/^[A-Z]{2}$/.test(data.estado)) return "Informe uma UF válida";
  if (data.cpfCnpj && ![11, 14].includes(data.cpfCnpj.length)) return "Informe um CPF ou CNPJ válido";
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return "Informe um e-mail válido";
  if (data.tipoPessoa === "PJ" && !partial && !data.razaoSocial && !data.nome) {
    return "Informe a razão social ou o nome da empresa";
  }
  if (
    data.faixaPrecoMin != null
    && data.faixaPrecoMax != null
    && data.faixaPrecoMax < data.faixaPrecoMin
  ) return "A faixa máxima deve ser maior ou igual à mínima";

  if (Object.prototype.hasOwnProperty.call(data, "interesses")) {
    const interesses = normalizeStringArray(data.interesses, { upper: true });
    if (!interesses || interesses.some((item) => !INTERESSES.includes(item))) {
      return "Interesses inválidos";
    }
    data.interesses = interesses;
  }
  if (Object.prototype.hasOwnProperty.call(data, "tags")) {
    const tags = normalizeStringArray(data.tags);
    if (!tags) return "Tags inválidas";
    data.tags = tags;
  }
  if (Object.prototype.hasOwnProperty.call(data, "cidadesInteresse")) {
    const cidades = normalizeStringArray(data.cidadesInteresse);
    if (!cidades) return "Cidades de interesse inválidas";
    data.cidadesInteresse = cidades;
  }
  return null;
}

async function validateRelations(data, empresaId) {
  if (!(await belongsToEmpresa(prisma, "usuario", data.corretorId, empresaId))) return false;
  return true;
}

function listInclude() {
  return {
    corretor: { select: { id: true, nome: true } },
    telefones: { orderBy: [{ principal: "desc" }, { id: "asc" }], take: 2 },
    emails: { orderBy: [{ principal: "desc" }, { id: "asc" }], take: 2 },
  };
}

function detailInclude(empresaId) {
  return {
    corretor: { select: { id: true, nome: true, email: true, telefone: true } },
    telefones: { orderBy: [{ principal: "desc" }, { id: "asc" }] },
    emails: { orderBy: [{ principal: "desc" }, { id: "asc" }] },
    enderecos: { orderBy: [{ principal: "desc" }, { id: "asc" }] },
    documentos: { orderBy: { createdAt: "desc" } },
    anotacoes: {
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { usuario: { select: { id: true, nome: true } } },
    },
    interacoes: {
      orderBy: { dataHora: "desc" },
      take: 20,
      include: {
        usuario: { select: { id: true, nome: true } },
        imovel: { select: { id: true, codigo: true, titulo: true } },
      },
    },
    historico: {
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { usuario: { select: { id: true, nome: true } } },
    },
    favoritos: {
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        imovel: {
          select: {
            id: true, codigo: true, titulo: true, status: true, cidade: true,
            bairro: true, valorVenda: true, valorAluguel: true, finalidade: true,
          },
        },
      },
    },
    visitas: {
      orderBy: { dataHora: "desc" },
      take: 20,
      include: {
        imovel: { select: { id: true, codigo: true, titulo: true } },
        usuario: { select: { id: true, nome: true } },
      },
    },
    propostas: {
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        imovel: { select: { id: true, codigo: true, titulo: true } },
        usuario: { select: { id: true, nome: true } },
      },
    },
    contratos: {
      where: { empresaId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { imovel: { select: { id: true, codigo: true, titulo: true } } },
    },
    leads: {
      where: { empresaId },
      orderBy: { createdAt: "desc" },
      take: 20,
    },
    imoveisProprietario: {
      where: { empresaId, ativo: true },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true, codigo: true, titulo: true, status: true, cidade: true, bairro: true,
      },
    },
  };
}

async function registrarHistorico(tx, {
  empresaId, clienteId, usuarioId, acao, alteracoes = null,
}) {
  return tx.clienteHistorico.create({
    data: { empresaId, clienteId, usuarioId, acao, alteracoes },
  });
}

export async function criarCliente(req, res) {
  try {
    const scope = empresaScope(req);
    const data = normalizeRelationIds(pickFields(req.body, CLIENTE_FIELDS), ["corretorId"]);
    data.corretorId = req.usuario.tipo === "CORRETOR"
      ? req.usuario.id
      : data.corretorId ?? req.usuario.id;
    if (!data.status) data.status = "PROSPECTO";
    if (data.tipo === "PROPRIETARIO") {
      return res.status(400).json({ erro: "Use o módulo Proprietários para cadastrar proprietários" });
    }

    const validationError = validateClienteData(data);
    if (validationError) return res.status(400).json({ erro: validationError });
    if (!(await validateRelations(data, scope.empresaId))) {
      return res.status(400).json({ erro: "Corretor inválido para esta empresa" });
    }

    const cliente = await prisma.$transaction(async (tx) => {
      const created = await tx.cliente.create({
        data: { ...data, ...scope },
        include: listInclude(),
      });
      await registrarHistorico(tx, {
        empresaId: scope.empresaId,
        clienteId: created.id,
        usuarioId: req.usuario.id,
        acao: "CRIADO",
        alteracoes: { nome: created.nome, tipo: created.tipo },
      });
      return created;
    });
    return res.status(201).json(cliente);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao cadastrar cliente");
  }
}

export async function listarClientes(req, res) {
  try {
    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, 12, 100);
    if (!page || !limit) return res.status(400).json({ erro: "Paginação inválida" });

    const {
      busca, tipo, tipoPessoa, status, cidade, origem, tag, interesse, ordenacao = "nome",
    } = req.query;
    if (tipo && !TIPOS_CLIENTE.includes(tipo)) return res.status(400).json({ erro: "Tipo inválido" });
    if (tipoPessoa && !TIPOS_PESSOA.includes(tipoPessoa)) return res.status(400).json({ erro: "Tipo de pessoa inválido" });
    if (status && !STATUS_CLIENTE.includes(status)) return res.status(400).json({ erro: "Status inválido" });
    if (interesse && !INTERESSES.includes(interesse)) return res.status(400).json({ erro: "Interesse inválido" });

    const corretorId = parsePositiveInteger(req.query.corretorId, undefined);
    const precoMin = parseOptionalNumber(req.query.faixaPrecoMin);
    const precoMax = parseOptionalNumber(req.query.faixaPrecoMax);
    if ([corretorId, precoMin, precoMax].includes(null)) {
      return res.status(400).json({ erro: "Um ou mais filtros são inválidos" });
    }
    if (req.usuario.tipo === "CORRETOR" && corretorId && corretorId !== req.usuario.id) {
      return res.status(403).json({ erro: "Corretores só podem consultar a própria carteira" });
    }

    const onlyInactive = req.query.ativo === "false";
    const orderBy = {
      nome: { nome: "asc" },
      recentes: { createdAt: "desc" },
      antigos: { createdAt: "asc" },
    }[ordenacao] || { nome: "asc" };

    const where = {
      ...ownershipScope(req),
      ...(onlyInactive ? { ativo: false } : { ativo: true }),
      ...(tipo ? { tipo } : { tipo: { not: "PROPRIETARIO" } }),
      ...(tipoPessoa && { tipoPessoa }),
      ...(status && { status }),
      ...(cidade && { cidade: { contains: cidade.trim(), mode: "insensitive" } }),
      ...(origem && { origem: { contains: origem.trim(), mode: "insensitive" } }),
      ...(tag && { tags: { has: tag.trim() } }),
      ...(interesse && { interesses: { has: interesse } }),
      ...(req.usuario.tipo !== "CORRETOR" && corretorId && { corretorId }),
      ...(precoMin != null && { faixaPrecoMax: { gte: precoMin } }),
      ...(precoMax != null && { faixaPrecoMin: { lte: precoMax } }),
      ...(busca && {
        OR: [
          { nome: { contains: busca.trim(), mode: "insensitive" } },
          { razaoSocial: { contains: busca.trim(), mode: "insensitive" } },
          { email: { contains: busca.trim(), mode: "insensitive" } },
          { telefone: { contains: busca.trim(), mode: "insensitive" } },
          { whatsapp: { contains: busca.trim(), mode: "insensitive" } },
          { cpfCnpj: { contains: busca.replace(/\D/g, "") } },
          { tags: { has: busca.trim() } },
        ],
      }),
    };

    const [data, total] = await prisma.$transaction([
      prisma.cliente.findMany({
        where,
        include: listInclude(),
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.cliente.count({ where }),
    ]);

    return res.json({
      data,
      meta: { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) },
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao listar clientes");
  }
}

export async function listarOpcoesCliente(req, res) {
  try {
    const scope = empresaScope(req);
    const corretores = await prisma.usuario.findMany({
      where: {
        ...scope,
        ativo: true,
        ...(req.usuario.tipo === "CORRETOR" && { id: req.usuario.id }),
      },
      select: { id: true, nome: true, tipo: true },
      orderBy: { nome: "asc" },
    });
    return res.json({
      corretores,
      tipos: TIPOS_CLIENTE,
      tiposPessoa: TIPOS_PESSOA,
      status: STATUS_CLIENTE,
      interesses: INTERESSES,
      tiposContato: TIPOS_CONTATO,
      tiposEndereco: TIPOS_ENDERECO,
      tiposDocumento: TIPOS_DOCUMENTO,
      tiposInteracao: TIPOS_INTERACAO,
      statusVisita: STATUS_VISITA,
      statusProposta: STATUS_PROPOSTA,
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao carregar opções de clientes");
  }
}

export async function buscarCliente(req, res) {
  try {
    const cliente = await prisma.cliente.findFirst({
      where: { id: Number(req.params.id), ...ownershipScope(req) },
      include: detailInclude(req.usuario.empresaId),
    });
    if (!cliente) return res.status(404).json({ erro: "Cliente não encontrado" });
    return res.json(cliente);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao buscar cliente");
  }
}

export async function atualizarCliente(req, res) {
  try {
    const scope = ownershipScope(req);
    const previous = await prisma.cliente.findFirst({
      where: { id: Number(req.params.id), ativo: true, ...scope },
    });
    if (!previous) return res.status(404).json({ erro: "Cliente não encontrado" });

    const data = normalizeRelationIds(pickFields(req.body, CLIENTE_FIELDS), ["corretorId"]);
    if (req.usuario.tipo === "CORRETOR") data.corretorId = req.usuario.id;
    const validationError = validateClienteData(data, { partial: true });
    if (validationError) return res.status(400).json({ erro: validationError });
    if (!(await validateRelations(data, req.usuario.empresaId))) {
      return res.status(400).json({ erro: "Corretor inválido para esta empresa" });
    }

    const changes = buildChanges(previous, data);
    const cliente = await prisma.$transaction(async (tx) => {
      const updated = await tx.cliente.update({
        where: { id: previous.id, ...scope },
        data,
        include: listInclude(),
      });
      if (Object.keys(changes).length > 0) {
        await registrarHistorico(tx, {
          empresaId: req.usuario.empresaId,
          clienteId: previous.id,
          usuarioId: req.usuario.id,
          acao: "ATUALIZADO",
          alteracoes: changes,
        });
      }
      return updated;
    });
    return res.json(cliente);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao atualizar cliente");
  }
}

export async function excluirCliente(req, res) {
  try {
    const scope = ownershipScope(req);
    if (req.usuario.tipo === "CORRETOR") {
      return res.status(403).json({ erro: "Corretores não podem desativar clientes" });
    }
    const cliente = await prisma.cliente.findFirst({
      where: { id: Number(req.params.id), ativo: true, ...scope },
      select: { id: true, nome: true },
    });
    if (!cliente) return res.status(404).json({ erro: "Cliente não encontrado" });

    const activeContract = await prisma.contrato.findFirst({
      where: {
        empresaId: req.usuario.empresaId,
        status: "ATIVO",
        OR: [{ clienteId: cliente.id }, { proprietarioId: cliente.id }],
      },
      select: { id: true },
    });
    if (activeContract) {
      return res.status(409).json({ erro: "Não é possível desativar um cliente com contrato ativo" });
    }

    await prisma.$transaction([
      prisma.cliente.update({
        where: { id: cliente.id, empresaId: req.usuario.empresaId },
        data: { ativo: false, status: "INATIVO", tokenCompartilhamento: null },
      }),
      prisma.clienteHistorico.create({
        data: {
          empresaId: req.usuario.empresaId,
          clienteId: cliente.id,
          usuarioId: req.usuario.id,
          acao: "DESATIVADO",
          alteracoes: { nome: cliente.nome },
        },
      }),
    ]);
    return res.json({ mensagem: "Cliente desativado com sucesso" });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao desativar cliente");
  }
}

export async function reativarCliente(req, res) {
  try {
    if (req.usuario.tipo === "CORRETOR") {
      return res.status(403).json({ erro: "Corretores não podem reativar clientes" });
    }
    const scope = ownershipScope(req);
    const cliente = await prisma.cliente.findFirst({
      where: { id: Number(req.params.id), ativo: false, ...scope },
      select: { id: true, nome: true },
    });
    if (!cliente) return res.status(404).json({ erro: "Cliente inativo não encontrado" });

    const reativado = await prisma.$transaction(async (tx) => {
      const updated = await tx.cliente.update({
        where: { id: cliente.id, ...scope },
        data: { ativo: true, status: "PROSPECTO" },
        include: listInclude(),
      });
      await registrarHistorico(tx, {
        empresaId: req.usuario.empresaId,
        clienteId: cliente.id,
        usuarioId: req.usuario.id,
        acao: "REATIVADO",
        alteracoes: { nome: cliente.nome },
      });
      return updated;
    });
    return res.json(reativado);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao reativar cliente");
  }
}

export async function listarHistoricoCliente(req, res) {
  try {
    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, 20, 100);
    if (!page || !limit) return res.status(400).json({ erro: "Paginação inválida" });
    const where = { empresaId: req.usuario.empresaId, clienteId: req.cliente.id };
    const [data, total] = await prisma.$transaction([
      prisma.clienteHistorico.findMany({
        where,
        include: { usuario: { select: { id: true, nome: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.clienteHistorico.count({ where }),
    ]);
    return res.json({
      data,
      meta: { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) },
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao carregar histórico");
  }
}

export async function criarAnotacao(req, res) {
  try {
    const conteudo = typeof req.body.conteudo === "string" ? req.body.conteudo.trim() : "";
    if (!conteudo || conteudo.length > 5000) {
      return res.status(400).json({ erro: "Informe uma anotação válida (até 5.000 caracteres)" });
    }
    const anotacao = await prisma.$transaction(async (tx) => {
      const created = await tx.clienteAnotacao.create({
        data: {
          empresaId: req.usuario.empresaId,
          clienteId: req.cliente.id,
          usuarioId: req.usuario.id,
          conteudo,
        },
        include: { usuario: { select: { id: true, nome: true } } },
      });
      await registrarHistorico(tx, {
        empresaId: req.usuario.empresaId,
        clienteId: req.cliente.id,
        usuarioId: req.usuario.id,
        acao: "ANOTACAO",
        alteracoes: { anotacaoId: created.id },
      });
      return created;
    });
    return res.status(201).json(anotacao);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao criar anotação");
  }
}

export async function criarInteracao(req, res) {
  try {
    const data = pickFields(req.body, ["tipo", "titulo", "descricao", "dataHora", "imovelId"]);
    if (hasInvalidEnum(data, "tipo", TIPOS_INTERACAO) || !data.titulo?.trim()) {
      return res.status(400).json({ erro: "Tipo e título da interação são obrigatórios" });
    }
    if (data.imovelId != null) {
      data.imovelId = Number(data.imovelId);
      if (!(await belongsToEmpresa(prisma, "imovel", data.imovelId, req.usuario.empresaId))) {
        return res.status(400).json({ erro: "Imóvel inválido para esta empresa" });
      }
    }
    const dataHora = data.dataHora ? new Date(data.dataHora) : new Date();
    if (Number.isNaN(dataHora.getTime())) return res.status(400).json({ erro: "Data da interação inválida" });

    const interacao = await prisma.$transaction(async (tx) => {
      const created = await tx.clienteInteracao.create({
        data: {
          empresaId: req.usuario.empresaId,
          clienteId: req.cliente.id,
          usuarioId: req.usuario.id,
          tipo: data.tipo,
          titulo: data.titulo.trim(),
          descricao: data.descricao?.trim() || null,
          dataHora,
          imovelId: data.imovelId || null,
        },
        include: {
          usuario: { select: { id: true, nome: true } },
          imovel: { select: { id: true, codigo: true, titulo: true } },
        },
      });
      await registrarHistorico(tx, {
        empresaId: req.usuario.empresaId,
        clienteId: req.cliente.id,
        usuarioId: req.usuario.id,
        acao: "INTERACAO",
        alteracoes: { interacaoId: created.id, tipo: created.tipo },
      });
      return created;
    });
    return res.status(201).json(interacao);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao registrar interação");
  }
}

export async function sincronizarContatos(req, res) {
  try {
    const telefones = Array.isArray(req.body.telefones) ? req.body.telefones : [];
    const emails = Array.isArray(req.body.emails) ? req.body.emails : [];
    const enderecos = Array.isArray(req.body.enderecos) ? req.body.enderecos : [];

    for (const item of telefones) {
      if (!item?.numero || hasInvalidEnum(item, "tipo", TIPOS_CONTATO)) {
        return res.status(400).json({ erro: "Telefones inválidos" });
      }
    }
    for (const item of emails) {
      if (!item?.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email) || hasInvalidEnum(item, "tipo", TIPOS_CONTATO)) {
        return res.status(400).json({ erro: "E-mails inválidos" });
      }
    }
    for (const item of enderecos) {
      if (!item?.logradouro || !item?.cidade || !item?.estado || hasInvalidEnum(item, "tipo", TIPOS_ENDERECO)) {
        return res.status(400).json({ erro: "Endereços inválidos" });
      }
      if (!/^[A-Za-z]{2}$/.test(item.estado)) return res.status(400).json({ erro: "UF do endereço inválida" });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.clienteTelefone.deleteMany({
        where: { empresaId: req.usuario.empresaId, clienteId: req.cliente.id },
      });
      await tx.clienteEmail.deleteMany({
        where: { empresaId: req.usuario.empresaId, clienteId: req.cliente.id },
      });
      await tx.clienteEndereco.deleteMany({
        where: { empresaId: req.usuario.empresaId, clienteId: req.cliente.id },
      });

      if (telefones.length) {
        await tx.clienteTelefone.createMany({
          data: telefones.map((item, index) => ({
            empresaId: req.usuario.empresaId,
            clienteId: req.cliente.id,
            numero: String(item.numero).trim(),
            tipo: item.tipo || "CELULAR",
            principal: Boolean(item.principal) || index === 0,
          })),
        });
      }
      if (emails.length) {
        await tx.clienteEmail.createMany({
          data: emails.map((item, index) => ({
            empresaId: req.usuario.empresaId,
            clienteId: req.cliente.id,
            email: String(item.email).trim().toLowerCase(),
            tipo: item.tipo || "OUTRO",
            principal: Boolean(item.principal) || index === 0,
          })),
        });
      }
      if (enderecos.length) {
        await tx.clienteEndereco.createMany({
          data: enderecos.map((item, index) => ({
            empresaId: req.usuario.empresaId,
            clienteId: req.cliente.id,
            tipo: item.tipo || "RESIDENCIAL",
            logradouro: String(item.logradouro).trim(),
            numero: item.numero?.trim() || null,
            complemento: item.complemento?.trim() || null,
            bairro: item.bairro?.trim() || null,
            cidade: String(item.cidade).trim(),
            estado: String(item.estado).trim().toUpperCase(),
            cep: item.cep ? String(item.cep).replace(/\D/g, "") : null,
            principal: Boolean(item.principal) || index === 0,
          })),
        });
      }

      await registrarHistorico(tx, {
        empresaId: req.usuario.empresaId,
        clienteId: req.cliente.id,
        usuarioId: req.usuario.id,
        acao: "ATUALIZADO",
        alteracoes: {
          telefones: telefones.length,
          emails: emails.length,
          enderecos: enderecos.length,
        },
      });

      return {
        telefones: await tx.clienteTelefone.findMany({
          where: { empresaId: req.usuario.empresaId, clienteId: req.cliente.id },
          orderBy: [{ principal: "desc" }, { id: "asc" }],
        }),
        emails: await tx.clienteEmail.findMany({
          where: { empresaId: req.usuario.empresaId, clienteId: req.cliente.id },
          orderBy: [{ principal: "desc" }, { id: "asc" }],
        }),
        enderecos: await tx.clienteEndereco.findMany({
          where: { empresaId: req.usuario.empresaId, clienteId: req.cliente.id },
          orderBy: [{ principal: "desc" }, { id: "asc" }],
        }),
      };
    });

    return res.json(result);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao sincronizar contatos");
  }
}

export async function uploadAvatar(req, res) {
  const uploadedPath = req.file?.path;
  try {
    if (!req.file) return res.status(400).json({ erro: "Selecione uma imagem de avatar" });
    const previous = await prisma.cliente.findFirst({
      where: { id: req.cliente.id, empresaId: req.usuario.empresaId },
      select: { avatarArquivo: true },
    });
    const avatarUrl = `/clientes/${req.cliente.id}/avatar/arquivo`;
    const updated = await prisma.$transaction(async (tx) => {
      const cliente = await tx.cliente.update({
        where: { id: req.cliente.id, empresaId: req.usuario.empresaId },
        data: { avatarUrl, avatarArquivo: req.file.filename },
        select: { id: true, avatarUrl: true },
      });
      await registrarHistorico(tx, {
        empresaId: req.usuario.empresaId,
        clienteId: req.cliente.id,
        usuarioId: req.usuario.id,
        acao: "AVATAR_ATUALIZADO",
      });
      return cliente;
    });
    if (previous?.avatarArquivo) {
      await removeFiles([
        clientFilePath(req.usuario.empresaId, req.cliente.id, "avatar", previous.avatarArquivo),
      ]);
    }
    return res.json(updated);
  } catch (error) {
    await removeFiles([uploadedPath]);
    return sendControllerError(res, error, "Erro ao atualizar avatar");
  }
}

export async function obterAvatar(req, res, next) {
  try {
    const cliente = await prisma.cliente.findFirst({
      where: { id: req.cliente.id, empresaId: req.usuario.empresaId },
      select: { avatarArquivo: true },
    });
    if (!cliente?.avatarArquivo) return res.status(404).json({ erro: "Avatar não encontrado" });
    res.setHeader("Cache-Control", "private, max-age=3600");
    return res.sendFile(
      clientFilePath(req.usuario.empresaId, req.cliente.id, "avatar", cliente.avatarArquivo),
      (error) => {
        if (error && !res.headersSent) next(error);
      },
    );
  } catch (error) {
    return next(error);
  }
}

export async function adicionarDocumentos(req, res) {
  const uploadedPaths = (req.files || []).map((file) => file.path);
  try {
    if (!req.files?.length) return res.status(400).json({ erro: "Selecione ao menos um documento" });
    const tipo = TIPOS_DOCUMENTO.includes(req.body.tipo) ? req.body.tipo : "OUTRO";

    const documentos = await prisma.$transaction(async (tx) => {
      const existing = await tx.clienteDocumento.count({
        where: { empresaId: req.usuario.empresaId, clienteId: req.cliente.id },
      });
      if (existing + req.files.length > MAX_CLIENT_DOCUMENTS) {
        const error = new Error("Limite de documentos");
        error.code = "DOC_LIMIT";
        throw error;
      }
      const created = [];
      for (const file of req.files) {
        const doc = await tx.clienteDocumento.create({
          data: {
            empresaId: req.usuario.empresaId,
            clienteId: req.cliente.id,
            tipo,
            nome: req.body.nome?.trim() || file.originalname || file.filename,
            nomeArquivo: file.filename,
            mimeType: file.mimetype,
            tamanho: file.size,
            url: "",
          },
        });
        created.push(await tx.clienteDocumento.update({
          where: { id: doc.id, empresaId: req.usuario.empresaId },
          data: { url: `/clientes/${req.cliente.id}/documentos/${doc.id}/arquivo` },
        }));
      }
      await registrarHistorico(tx, {
        empresaId: req.usuario.empresaId,
        clienteId: req.cliente.id,
        usuarioId: req.usuario.id,
        acao: "DOCUMENTO_ADICIONADO",
        alteracoes: { quantidade: created.length },
      });
      return created;
    });
    return res.status(201).json(documentos);
  } catch (error) {
    await removeFiles(uploadedPaths);
    if (error.code === "DOC_LIMIT") {
      return res.status(400).json({ erro: `Cada cliente pode ter no máximo ${MAX_CLIENT_DOCUMENTS} documentos` });
    }
    return sendControllerError(res, error, "Erro ao enviar documentos");
  }
}

export async function obterDocumento(req, res, next) {
  try {
    const documento = await prisma.clienteDocumento.findFirst({
      where: {
        id: Number(req.params.documentoId),
        empresaId: req.usuario.empresaId,
        clienteId: req.cliente.id,
      },
    });
    if (!documento) return res.status(404).json({ erro: "Documento não encontrado" });
    res.type(documento.mimeType);
    res.setHeader("Cache-Control", "private, max-age=3600");
    return res.sendFile(
      clientFilePath(req.usuario.empresaId, req.cliente.id, "documentos", documento.nomeArquivo),
      (error) => {
        if (error && !res.headersSent) next(error);
      },
    );
  } catch (error) {
    return next(error);
  }
}

export async function excluirDocumento(req, res) {
  try {
    const documento = await prisma.clienteDocumento.findFirst({
      where: {
        id: Number(req.params.documentoId),
        empresaId: req.usuario.empresaId,
        clienteId: req.cliente.id,
      },
    });
    if (!documento) return res.status(404).json({ erro: "Documento não encontrado" });

    await prisma.$transaction(async (tx) => {
      await tx.clienteDocumento.delete({
        where: { id: documento.id, empresaId: req.usuario.empresaId },
      });
      await registrarHistorico(tx, {
        empresaId: req.usuario.empresaId,
        clienteId: req.cliente.id,
        usuarioId: req.usuario.id,
        acao: "DOCUMENTO_REMOVIDO",
        alteracoes: { documentoId: documento.id },
      });
    });
    await removeFiles([
      clientFilePath(req.usuario.empresaId, req.cliente.id, "documentos", documento.nomeArquivo),
    ]);
    return res.json({ mensagem: "Documento removido" });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao remover documento");
  }
}

export async function adicionarFavorito(req, res) {
  try {
    const imovelId = Number(req.body.imovelId);
    if (!Number.isInteger(imovelId) || imovelId <= 0) {
      return res.status(400).json({ erro: "Informe um imóvel válido" });
    }
    if (!(await belongsToEmpresa(prisma, "imovel", imovelId, req.usuario.empresaId))) {
      return res.status(400).json({ erro: "Imóvel inválido para esta empresa" });
    }
    const favorito = await prisma.$transaction(async (tx) => {
      const created = await tx.clienteFavorito.upsert({
        where: { clienteId_imovelId: { clienteId: req.cliente.id, imovelId } },
        update: {},
        create: {
          empresaId: req.usuario.empresaId,
          clienteId: req.cliente.id,
          imovelId,
        },
        include: {
          imovel: {
            select: {
              id: true, codigo: true, titulo: true, status: true,
              cidade: true, bairro: true, valorVenda: true, valorAluguel: true,
            },
          },
        },
      });
      await registrarHistorico(tx, {
        empresaId: req.usuario.empresaId,
        clienteId: req.cliente.id,
        usuarioId: req.usuario.id,
        acao: "FAVORITO_ADICIONADO",
        alteracoes: { imovelId },
      });
      return created;
    });
    return res.status(201).json(favorito);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao adicionar favorito");
  }
}

export async function removerFavorito(req, res) {
  try {
    const imovelId = Number(req.params.imovelId);
    const favorito = await prisma.clienteFavorito.findFirst({
      where: {
        empresaId: req.usuario.empresaId,
        clienteId: req.cliente.id,
        imovelId,
      },
    });
    if (!favorito) return res.status(404).json({ erro: "Favorito não encontrado" });
    await prisma.$transaction(async (tx) => {
      await tx.clienteFavorito.delete({ where: { id: favorito.id } });
      await registrarHistorico(tx, {
        empresaId: req.usuario.empresaId,
        clienteId: req.cliente.id,
        usuarioId: req.usuario.id,
        acao: "FAVORITO_REMOVIDO",
        alteracoes: { imovelId },
      });
    });
    return res.json({ mensagem: "Favorito removido" });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao remover favorito");
  }
}

export async function criarVisita(req, res) {
  try {
    const data = pickFields(req.body, ["imovelId", "dataHora", "status", "observacoes"]);
    data.imovelId = Number(data.imovelId);
    if (!Number.isInteger(data.imovelId) || data.imovelId <= 0 || !data.dataHora) {
      return res.status(400).json({ erro: "Imóvel e data da visita são obrigatórios" });
    }
    if (hasInvalidEnum(data, "status", STATUS_VISITA)) {
      return res.status(400).json({ erro: "Status de visita inválido" });
    }
    if (!(await belongsToEmpresa(prisma, "imovel", data.imovelId, req.usuario.empresaId))) {
      return res.status(400).json({ erro: "Imóvel inválido para esta empresa" });
    }
    const dataHora = new Date(data.dataHora);
    if (Number.isNaN(dataHora.getTime())) return res.status(400).json({ erro: "Data inválida" });

    const visita = await prisma.$transaction(async (tx) => {
      const created = await tx.clienteVisita.create({
        data: {
          empresaId: req.usuario.empresaId,
          clienteId: req.cliente.id,
          imovelId: data.imovelId,
          usuarioId: req.usuario.id,
          dataHora,
          status: data.status || "AGENDADA",
          observacoes: data.observacoes?.trim() || null,
        },
        include: {
          imovel: { select: { id: true, codigo: true, titulo: true } },
          usuario: { select: { id: true, nome: true } },
        },
      });
      await registrarHistorico(tx, {
        empresaId: req.usuario.empresaId,
        clienteId: req.cliente.id,
        usuarioId: req.usuario.id,
        acao: "VISITA_REGISTRADA",
        alteracoes: { visitaId: created.id, imovelId: data.imovelId },
      });
      return created;
    });
    return res.status(201).json(visita);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao registrar visita");
  }
}

export async function criarProposta(req, res) {
  try {
    const data = pickFields(req.body, ["imovelId", "valor", "status", "observacoes"]);
    data.imovelId = Number(data.imovelId);
    data.valor = Number(data.valor);
    if (!Number.isInteger(data.imovelId) || data.imovelId <= 0 || !Number.isFinite(data.valor) || data.valor <= 0) {
      return res.status(400).json({ erro: "Imóvel e valor da proposta são obrigatórios" });
    }
    if (hasInvalidEnum(data, "status", STATUS_PROPOSTA)) {
      return res.status(400).json({ erro: "Status de proposta inválido" });
    }
    if (!(await belongsToEmpresa(prisma, "imovel", data.imovelId, req.usuario.empresaId))) {
      return res.status(400).json({ erro: "Imóvel inválido para esta empresa" });
    }

    const proposta = await prisma.$transaction(async (tx) => {
      const created = await tx.clienteProposta.create({
        data: {
          empresaId: req.usuario.empresaId,
          clienteId: req.cliente.id,
          imovelId: data.imovelId,
          usuarioId: req.usuario.id,
          valor: data.valor,
          status: data.status || "RASCUNHO",
          observacoes: data.observacoes?.trim() || null,
        },
        include: {
          imovel: { select: { id: true, codigo: true, titulo: true } },
          usuario: { select: { id: true, nome: true } },
        },
      });
      await registrarHistorico(tx, {
        empresaId: req.usuario.empresaId,
        clienteId: req.cliente.id,
        usuarioId: req.usuario.id,
        acao: "PROPOSTA_REGISTRADA",
        alteracoes: { propostaId: created.id, imovelId: data.imovelId, valor: data.valor },
      });
      return created;
    });
    return res.status(201).json(proposta);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao registrar proposta");
  }
}

export async function compartilharCliente(req, res) {
  try {
    const token = randomUUID().replace(/-/g, "");
    const cliente = await prisma.$transaction(async (tx) => {
      const updated = await tx.cliente.update({
        where: { id: req.cliente.id, empresaId: req.usuario.empresaId },
        data: { tokenCompartilhamento: token },
        select: { id: true, nome: true, tokenCompartilhamento: true },
      });
      await registrarHistorico(tx, {
        empresaId: req.usuario.empresaId,
        clienteId: req.cliente.id,
        usuarioId: req.usuario.id,
        acao: "COMPARTILHADO",
      });
      return updated;
    });
    return res.json({
      ...cliente,
      url: `/clientes/compartilhado/${cliente.tokenCompartilhamento}`,
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao compartilhar cadastro");
  }
}

export async function buscarClienteCompartilhado(req, res) {
  try {
    const cliente = await prisma.cliente.findFirst({
      where: {
        tokenCompartilhamento: req.params.token,
        empresaId: req.usuario.empresaId,
        ativo: true,
      },
      select: {
        id: true, nome: true, tipo: true, tipoPessoa: true, status: true,
        email: true, telefone: true, cidade: true, estado: true, origem: true,
        interesses: true, tags: true, corretor: { select: { id: true, nome: true } },
      },
    });
    if (!cliente) return res.status(404).json({ erro: "Cadastro compartilhado não encontrado" });
    return res.json(cliente);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao carregar cadastro compartilhado");
  }
}

export async function exportarClientePdf(req, res) {
  try {
    const cliente = await prisma.cliente.findFirst({
      where: { id: Number(req.params.id), ...ownershipScope(req) },
      include: detailInclude(req.usuario.empresaId),
    });
    if (!cliente) return res.status(404).json({ erro: "Cliente não encontrado" });
    return buildClientePdf(cliente, res);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao exportar PDF");
  }
}

export async function exportarClientesExcel(req, res) {
  try {
    const where = {
      ...ownershipScope(req),
      ativo: req.query.ativo === "false" ? false : true,
    };
    const clientes = await prisma.cliente.findMany({
      where,
      include: { corretor: { select: { id: true, nome: true } } },
      orderBy: { nome: "asc" },
      take: 5000,
    });
    return buildClientesExcel(clientes, res);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao exportar Excel");
  }
}
