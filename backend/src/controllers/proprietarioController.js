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

const PROPRIETARIO_FIELDS = [
  "tipoPessoa", "status", "nome", "razaoSocial", "nomeFantasia",
  "cpfCnpj", "email", "telefone", "whatsapp", "endereco", "cidade", "estado",
  "notas", "origem", "corretorId",
];
const TIPOS_PESSOA = ["PF", "PJ"];
const STATUS_CLIENTE = ["PROSPECTO", "QUALIFICADO", "NEGOCIACAO", "CLIENTE", "INATIVO", "PERDIDO"];
const TIPOS_CONTA = ["CORRENTE", "POUPANCA", "PAGAMENTO"];

function parsePositiveInteger(value, fallback, maximum = Number.MAX_SAFE_INTEGER) {
  if (value == null || value === "") return fallback;
  const number = Number(value);
  return Number.isInteger(number) && number > 0 && number <= maximum ? number : null;
}

function normalizeText(data) {
  for (const [field, value] of Object.entries(data)) {
    if (typeof value === "string") data[field] = value.trim();
  }
  if (typeof data.cpfCnpj === "string") data.cpfCnpj = data.cpfCnpj.replace(/\D/g, "");
  if (typeof data.estado === "string") data.estado = data.estado.toUpperCase();
  if (typeof data.email === "string") data.email = data.email.toLowerCase();
}

function listInclude() {
  return {
    corretor: { select: { id: true, nome: true } },
    telefones: { orderBy: [{ principal: "desc" }, { id: "asc" }], take: 2 },
    emails: { orderBy: [{ principal: "desc" }, { id: "asc" }], take: 2 },
    dadosBancarios: { orderBy: [{ principal: "desc" }, { id: "asc" }], take: 1 },
    _count: { select: { imoveisProprietario: true, contratosProprietario: true, documentos: true } },
  };
}

function detailInclude(empresaId) {
  return {
    corretor: { select: { id: true, nome: true, email: true, telefone: true } },
    telefones: { orderBy: [{ principal: "desc" }, { id: "asc" }] },
    emails: { orderBy: [{ principal: "desc" }, { id: "asc" }] },
    enderecos: { orderBy: [{ principal: "desc" }, { id: "asc" }] },
    documentos: { orderBy: { createdAt: "desc" } },
    dadosBancarios: { orderBy: [{ principal: "desc" }, { id: "asc" }] },
    anotacoes: {
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { usuario: { select: { id: true, nome: true } } },
    },
    historico: {
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { usuario: { select: { id: true, nome: true } } },
    },
    imoveisProprietario: {
      where: { empresaId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true, codigo: true, titulo: true, status: true, cidade: true, bairro: true,
        valorVenda: true, valorAluguel: true, finalidade: true, ativo: true, corretorId: true,
        corretor: { select: { id: true, nome: true } },
      },
    },
    contratosProprietario: {
      where: { empresaId },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        imovel: { select: { id: true, codigo: true, titulo: true } },
        cliente: { select: { id: true, nome: true } },
      },
    },
  };
}

function validateData(data, { partial = false } = {}) {
  normalizeText(data);
  if (hasInvalidEnum(data, "tipoPessoa", TIPOS_PESSOA) || hasInvalidEnum(data, "status", STATUS_CLIENTE)) {
    return "Pessoa ou status inválidos";
  }
  if (!partial && !data.nome) return "Nome do proprietário é obrigatório";
  if (data.nome && data.nome.length > 160) return "Nome deve ter no máximo 160 caracteres";
  if (data.estado && !/^[A-Z]{2}$/.test(data.estado)) return "UF inválida";
  if (data.cpfCnpj && ![11, 14].includes(data.cpfCnpj.length)) return "CPF/CNPJ inválido";
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return "E-mail inválido";
  return null;
}

async function registrarHistorico(tx, payload) {
  return tx.clienteHistorico.create({
    data: { ...payload, acao: payload.acao || "ATUALIZADO" },
  });
}

export async function listarOpcoesProprietario(req, res) {
  try {
    const scope = empresaScope(req);
    const corretores = await prisma.usuario.findMany({
      where: {
        ...scope,
        ativo: true,
        ...(req.usuario.tipo === "CORRETOR" && { id: req.usuario.id }),
      },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    });
    return res.json({
      corretores,
      tiposPessoa: TIPOS_PESSOA,
      status: STATUS_CLIENTE,
      tiposConta: TIPOS_CONTA,
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao carregar opções de proprietários");
  }
}

export async function dashboardProprietario(req, res) {
  try {
    const scope = { ...ownershipScope(req), tipo: "PROPRIETARIO" };
    const proprietarios = await prisma.cliente.findMany({
      where: { ...scope, ativo: true },
      select: { id: true },
    });
    const ids = proprietarios.map((item) => item.id);
    const [imoveis, contratosAtivos, valorCarteira] = await Promise.all([
      prisma.imovel.count({ where: { empresaId: req.usuario.empresaId, proprietarioId: { in: ids }, ativo: true } }),
      prisma.contrato.count({
        where: { empresaId: req.usuario.empresaId, proprietarioId: { in: ids }, status: "ATIVO" },
      }),
      prisma.imovel.aggregate({
        where: { empresaId: req.usuario.empresaId, proprietarioId: { in: ids }, ativo: true },
        _sum: { valorVenda: true, valorAluguel: true },
      }),
    ]);
    return res.json({
      resumo: {
        total: proprietarios.length,
        imoveis,
        contratosAtivos,
        valorVenda: valorCarteira._sum.valorVenda || 0,
        valorAluguel: valorCarteira._sum.valorAluguel || 0,
      },
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao carregar dashboard de proprietários");
  }
}

export async function listarProprietarios(req, res) {
  try {
    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, 12, 100);
    if (!page || !limit) return res.status(400).json({ erro: "Paginação inválida" });

    const { busca, cidade, tipoPessoa, status, corretorId } = req.query;
    const parsedCorretor = parsePositiveInteger(corretorId, undefined);
    if (parsedCorretor === null) return res.status(400).json({ erro: "Corretor inválido" });
    if (tipoPessoa && !TIPOS_PESSOA.includes(tipoPessoa)) return res.status(400).json({ erro: "Tipo de pessoa inválido" });
    if (status && !STATUS_CLIENTE.includes(status)) return res.status(400).json({ erro: "Status inválido" });

    const where = {
      ...ownershipScope(req),
      tipo: "PROPRIETARIO",
      ativo: req.query.ativo === "false" ? false : true,
      ...(tipoPessoa && { tipoPessoa }),
      ...(status && { status }),
      ...(cidade && { cidade: { contains: cidade.trim(), mode: "insensitive" } }),
      ...(req.usuario.tipo !== "CORRETOR" && parsedCorretor && { corretorId: parsedCorretor }),
      ...(busca && {
        OR: [
          { nome: { contains: busca.trim(), mode: "insensitive" } },
          { razaoSocial: { contains: busca.trim(), mode: "insensitive" } },
          { email: { contains: busca.trim(), mode: "insensitive" } },
          { telefone: { contains: busca.trim(), mode: "insensitive" } },
          { cpfCnpj: { contains: String(busca).replace(/\D/g, "") } },
        ],
      }),
    };

    const [data, total] = await prisma.$transaction([
      prisma.cliente.findMany({
        where,
        include: listInclude(),
        orderBy: { nome: "asc" },
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
    return sendControllerError(res, error, "Erro ao listar proprietários");
  }
}

export async function criarProprietario(req, res) {
  try {
    const scope = empresaScope(req);
    const data = normalizeRelationIds(pickFields(req.body, PROPRIETARIO_FIELDS), ["corretorId"]);
    data.tipo = "PROPRIETARIO";
    data.corretorId = req.usuario.tipo === "CORRETOR" ? req.usuario.id : data.corretorId ?? req.usuario.id;
    if (!data.status) data.status = "CLIENTE";
    if (!data.tipoPessoa) data.tipoPessoa = "PF";

    const validationError = validateData(data);
    if (validationError) return res.status(400).json({ erro: validationError });
    if (!(await belongsToEmpresa(prisma, "usuario", data.corretorId, scope.empresaId))) {
      return res.status(400).json({ erro: "Corretor inválido" });
    }

    const created = await prisma.$transaction(async (tx) => {
      const proprietario = await tx.cliente.create({
        data: { ...data, ...scope },
        include: listInclude(),
      });
      await registrarHistorico(tx, {
        empresaId: scope.empresaId,
        clienteId: proprietario.id,
        usuarioId: req.usuario.id,
        acao: "CRIADO",
        alteracoes: { tipo: "PROPRIETARIO", nome: proprietario.nome },
      });
      return proprietario;
    });
    return res.status(201).json(created);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao cadastrar proprietário");
  }
}

export async function buscarProprietario(req, res) {
  try {
    const proprietario = await prisma.cliente.findFirst({
      where: {
        id: Number(req.params.id),
        tipo: "PROPRIETARIO",
        ...ownershipScope(req),
      },
      include: detailInclude(req.usuario.empresaId),
    });
    if (!proprietario) return res.status(404).json({ erro: "Proprietário não encontrado" });

    const ativos = (proprietario.imoveisProprietario || []).filter((item) => item.ativo);
    const dashboard = {
      imoveis: ativos.length,
      contratosAtivos: (proprietario.contratosProprietario || []).filter((item) => item.status === "ATIVO").length,
      valorVenda: ativos.reduce((sum, item) => sum + (item.valorVenda || 0), 0),
      valorAluguel: ativos.reduce((sum, item) => sum + (item.valorAluguel || 0), 0),
    };
    return res.json({ ...proprietario, dashboard });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao buscar proprietário");
  }
}

export async function atualizarProprietario(req, res) {
  try {
    const previous = await prisma.cliente.findFirst({
      where: {
        id: Number(req.params.id),
        tipo: "PROPRIETARIO",
        ativo: true,
        ...ownershipScope(req),
      },
    });
    if (!previous) return res.status(404).json({ erro: "Proprietário não encontrado" });

    const data = normalizeRelationIds(pickFields(req.body, PROPRIETARIO_FIELDS), ["corretorId"]);
    data.tipo = "PROPRIETARIO";
    if (req.usuario.tipo === "CORRETOR") data.corretorId = req.usuario.id;
    const validationError = validateData(data, { partial: true });
    if (validationError) return res.status(400).json({ erro: validationError });
    if (!(await belongsToEmpresa(prisma, "usuario", data.corretorId, req.usuario.empresaId))) {
      return res.status(400).json({ erro: "Corretor inválido" });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const proprietario = await tx.cliente.update({
        where: { id: previous.id, empresaId: req.usuario.empresaId },
        data,
        include: listInclude(),
      });
      await registrarHistorico(tx, {
        empresaId: req.usuario.empresaId,
        clienteId: previous.id,
        usuarioId: req.usuario.id,
        acao: "ATUALIZADO",
        alteracoes: data,
      });
      return proprietario;
    });
    return res.json(updated);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao atualizar proprietário");
  }
}

export async function excluirProprietario(req, res) {
  try {
    if (req.usuario.tipo === "CORRETOR") {
      return res.status(403).json({ erro: "Corretores não podem desativar proprietários" });
    }
    const proprietario = await prisma.cliente.findFirst({
      where: {
        id: Number(req.params.id),
        tipo: "PROPRIETARIO",
        ativo: true,
        ...ownershipScope(req),
      },
      select: { id: true, nome: true },
    });
    if (!proprietario) return res.status(404).json({ erro: "Proprietário não encontrado" });

    const imovelAtivo = await prisma.imovel.findFirst({
      where: { empresaId: req.usuario.empresaId, proprietarioId: proprietario.id, ativo: true },
      select: { id: true },
    });
    if (imovelAtivo) {
      return res.status(409).json({ erro: "Desvincule ou desative os imóveis antes de desativar o proprietário" });
    }

    await prisma.$transaction([
      prisma.cliente.update({
        where: { id: proprietario.id, empresaId: req.usuario.empresaId },
        data: { ativo: false, status: "INATIVO" },
      }),
      prisma.clienteHistorico.create({
        data: {
          empresaId: req.usuario.empresaId,
          clienteId: proprietario.id,
          usuarioId: req.usuario.id,
          acao: "DESATIVADO",
          alteracoes: { nome: proprietario.nome },
        },
      }),
    ]);
    return res.json({ mensagem: "Proprietário desativado" });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao desativar proprietário");
  }
}

export async function reativarProprietario(req, res) {
  try {
    if (req.usuario.tipo === "CORRETOR") {
      return res.status(403).json({ erro: "Corretores não podem reativar proprietários" });
    }
    const proprietario = await prisma.cliente.findFirst({
      where: {
        id: Number(req.params.id),
        tipo: "PROPRIETARIO",
        ativo: false,
        ...ownershipScope(req),
      },
      select: { id: true },
    });
    if (!proprietario) return res.status(404).json({ erro: "Proprietário inativo não encontrado" });

    const updated = await prisma.$transaction(async (tx) => {
      const item = await tx.cliente.update({
        where: { id: proprietario.id, empresaId: req.usuario.empresaId },
        data: { ativo: true, status: "CLIENTE", tipo: "PROPRIETARIO" },
        include: listInclude(),
      });
      await registrarHistorico(tx, {
        empresaId: req.usuario.empresaId,
        clienteId: proprietario.id,
        usuarioId: req.usuario.id,
        acao: "REATIVADO",
      });
      return item;
    });
    return res.json(updated);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao reativar proprietário");
  }
}

export async function sincronizarDadosBancarios(req, res) {
  try {
    const proprietario = await prisma.cliente.findFirst({
      where: {
        id: Number(req.params.id),
        tipo: "PROPRIETARIO",
        ativo: true,
        ...ownershipScope(req),
      },
      select: { id: true },
    });
    if (!proprietario) return res.status(404).json({ erro: "Proprietário não encontrado" });

    const contas = Array.isArray(req.body.contas) ? req.body.contas : [];
    for (const item of contas) {
      if (!item?.banco || hasInvalidEnum(item, "tipoConta", TIPOS_CONTA)) {
        return res.status(400).json({ erro: "Dados bancários inválidos" });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.clienteDadosBancarios.deleteMany({
        where: { empresaId: req.usuario.empresaId, clienteId: proprietario.id },
      });
      if (contas.length) {
        await tx.clienteDadosBancarios.createMany({
          data: contas.map((item, index) => ({
            empresaId: req.usuario.empresaId,
            clienteId: proprietario.id,
            banco: String(item.banco).trim(),
            agencia: item.agencia?.trim() || null,
            conta: item.conta?.trim() || null,
            tipoConta: item.tipoConta || "CORRENTE",
            pix: item.pix?.trim() || null,
            titular: item.titular?.trim() || null,
            documentoTitular: item.documentoTitular ? String(item.documentoTitular).replace(/\D/g, "") : null,
            principal: Boolean(item.principal) || index === 0,
          })),
        });
      }
      await registrarHistorico(tx, {
        empresaId: req.usuario.empresaId,
        clienteId: proprietario.id,
        usuarioId: req.usuario.id,
        acao: "ATUALIZADO",
        alteracoes: { dadosBancarios: contas.length },
      });
      return tx.clienteDadosBancarios.findMany({
        where: { empresaId: req.usuario.empresaId, clienteId: proprietario.id },
        orderBy: [{ principal: "desc" }, { id: "asc" }],
      });
    });
    return res.json(result);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao salvar dados bancários");
  }
}

export async function criarAnotacaoProprietario(req, res) {
  try {
    const proprietario = await prisma.cliente.findFirst({
      where: {
        id: Number(req.params.id),
        tipo: "PROPRIETARIO",
        ativo: true,
        ...ownershipScope(req),
      },
      select: { id: true },
    });
    if (!proprietario) return res.status(404).json({ erro: "Proprietário não encontrado" });
    const conteudo = typeof req.body.conteudo === "string" ? req.body.conteudo.trim() : "";
    if (!conteudo) return res.status(400).json({ erro: "Informe a anotação" });

    const anotacao = await prisma.$transaction(async (tx) => {
      const created = await tx.clienteAnotacao.create({
        data: {
          empresaId: req.usuario.empresaId,
          clienteId: proprietario.id,
          usuarioId: req.usuario.id,
          conteudo,
        },
        include: { usuario: { select: { id: true, nome: true } } },
      });
      await registrarHistorico(tx, {
        empresaId: req.usuario.empresaId,
        clienteId: proprietario.id,
        usuarioId: req.usuario.id,
        acao: "ANOTACAO",
      });
      return created;
    });
    return res.status(201).json(anotacao);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao criar anotação");
  }
}
