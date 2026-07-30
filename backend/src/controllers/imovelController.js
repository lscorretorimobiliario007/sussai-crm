import prisma from "../config/prisma.js";
import { empresaScope, gerarCodigoImovel, ownershipScope } from "../utils/helpers.js";
import {
  belongsToEmpresa,
  hasInvalidEnum,
  normalizeIntegerFields,
  normalizeNumberFields,
  normalizeRelationIds,
  pickFields,
  sendControllerError,
} from "../utils/security.js";
import {
  hasValidImageSignature,
  propertyImagePath,
  removeFiles,
} from "../services/imovelImageStorage.js";
import { MAX_PROPERTY_IMAGES } from "../config/uploads.js";
import { buildImovelSlug, slugify } from "../utils/slug.js";

const IMOVEL_FIELDS = [
  "codigo", "titulo", "descricao", "finalidade", "tipo", "status",
  "valorVenda", "valorAluguel", "endereco", "numero", "complemento", "bairro",
  "cidade", "estado", "cep", "quartos", "suites", "banheiros", "vagas",
  "areaTerreno", "areaConstruida", "areaUtil", "piscina", "churrasqueira",
  "iptu", "condominio", "caracteristicas", "corretorId", "proprietarioId", "angariadorId",
  "exclusividade", "aceitaFinanciamento", "aceitaFgts", "aceitaPermuta", "aceitaVeiculo",
  "estudaProposta", "ocupacao", "observacoesInternas",
  "matricula", "inscricaoMunicipal", "habiteSe", "averbacao",
  "dataCaptacao", "origemCaptacao", "situacaoCaptacao", "proximoContatoProprietario",
  "localChaves", "codigoChave", "chavesNaImobiliaria", "chaveDigital", "chaveRetirada",
  "chaveRetiradaEm", "chaveRetiradaPor", "chaveDevolvidaEm", "chaveObservacoes",
  "publicadoSite", "destaqueSite", "lancamento", "altoPadrao",
  "publicacaoComercial", "oculto", "emRevisao", "slug",
  "seoTitulo", "seoDescricao", "tourVirtualUrl", "videoUrl", "plantaUrl",
  "latitude", "longitude",
];
const STATUS_IMOVEL = ["DISPONIVEL", "RESERVADO", "VENDIDO", "ALUGADO", "INATIVO"];
const FINALIDADES = ["VENDA", "LOCACAO", "VENDA_E_LOCACAO"];
const TIPOS_IMOVEL = [
  "APARTAMENTO", "CASA", "TERRENO", "COMERCIAL", "RURAL",
  "KITNET", "SOBRADO", "COBERTURA", "GALPAO", "SALA_COMERCIAL",
];
const OCUPACOES = ["DESOCUPADO", "OCUPADO_PROPRIETARIO", "OCUPADO_INQUILINO", "EM_REFORMA"];
const ORIGENS_CAPTACAO = [
  "INDICACAO", "PLACA", "SITE", "REDES_SOCIAIS", "CAPTACAO_ATIVA",
  "PROPRIETARIO", "PARCEIRO", "PORTAIS", "OUTRO",
];
const SITUACOES_CAPTACAO = [
  "EM_ANALISE", "DOCUMENTACAO", "ATIVO", "NEGOCIACAO", "SUSPENSO", "ENCERRADO",
];
/** Catálogo canônico CRM + site (filtros públicos). */
const CARACTERISTICAS = new Set([
  "PISCINA", "EDICULA", "CHURRASQUEIRA", "AREA_GOURMET", "JARDIM", "CLOSET",
  "ESCRITORIO", "LAVABO", "MOBILIADO", "SEMI_MOBILIADO", "PLANEJADOS", "ACADEMIA", "QUADRA",
  "SALAO_FESTAS", "ELEVADOR", "PORTARIA", "ENERGIA_SOLAR", "POCO_ARTESIANO",
  "PORTAO_ELETRONICO", "SACADA", "AR_CONDICIONADO", "AQUECIMENTO", "INTERNET",
  "GAS_ENCANADO", "AUTOMACAO", "VARANDA", "PORTARIA_24H", "ACEITA_PETS", "PLAYGROUND",
]);
const FILTROS_SITE = [
  "PISCINA", "EDICULA", "CHURRASQUEIRA", "AREA_GOURMET", "JARDIM", "CLOSET",
  "ESCRITORIO", "LAVABO", "MOBILIADO", "SEMI_MOBILIADO", "PLANEJADOS", "ACADEMIA", "QUADRA",
  "SALAO_FESTAS", "ELEVADOR", "PORTARIA", "ENERGIA_SOLAR", "POCO_ARTESIANO",
  "PORTAO_ELETRONICO", "SACADA", "AR_CONDICIONADO", "AQUECIMENTO", "INTERNET",
  "GAS_ENCANADO", "AUTOMACAO",
];
const NUMBER_FIELDS = [
  "valorVenda", "valorAluguel", "areaTerreno", "areaConstruida",
  "areaUtil", "iptu", "condominio",
];
const INTEGER_FIELDS = ["quartos", "suites", "banheiros", "vagas"];
const BOOLEAN_FIELDS = [
  "piscina", "churrasqueira", "exclusividade", "aceitaFinanciamento", "aceitaFgts",
  "aceitaPermuta", "aceitaVeiculo", "estudaProposta", "habiteSe", "averbacao",
  "chavesNaImobiliaria", "chaveRetirada", "publicadoSite", "destaqueSite",
  "lancamento", "altoPadrao", "publicacaoComercial", "oculto", "emRevisao",
];
const DATE_FIELDS = [
  "chaveRetiradaEm", "chaveDevolvidaEm", "dataCaptacao", "proximoContatoProprietario",
];
const NUMBER_GEO_FIELDS = ["latitude", "longitude"];
const TEXT_LIMITS = {
  observacoesInternas: 5000,
  localChaves: 200,
  codigoChave: 80,
  chaveRetiradaPor: 160,
  chaveObservacoes: 2000,
  matricula: 80,
  inscricaoMunicipal: 80,
  chaveDigital: 500,
  slug: 140,
  seoTitulo: 160,
  seoDescricao: 320,
  tourVirtualUrl: 500,
  videoUrl: 500,
  plantaUrl: 500,
};
const SORT_OPTIONS = {
  recentes: { createdAt: "desc" },
  antigos: { createdAt: "asc" },
  maior_valor: { valorVenda: "desc" },
  menor_valor: { valorVenda: "asc" },
  titulo: { titulo: "asc" },
};

function normalizeBooleans(data) {
  for (const field of BOOLEAN_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(data, field)) continue;
    if (typeof data[field] === "boolean") continue;
    if (data[field] === "true" || data[field] === "false") {
      data[field] = data[field] === "true";
      continue;
    }
    return false;
  }
  return true;
}

function normalizeDates(data) {
  for (const field of DATE_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(data, field)) continue;
    if (data[field] == null || data[field] === "") {
      data[field] = null;
      continue;
    }
    const date = new Date(data[field]);
    if (Number.isNaN(date.getTime())) return false;
    data[field] = date;
  }
  return true;
}

function syncAmenityFlags(data) {
  if (!Object.prototype.hasOwnProperty.call(data, "caracteristicas") || !Array.isArray(data.caracteristicas)) {
    return;
  }
  const features = new Set(data.caracteristicas);
  if (data.piscina === true) features.add("PISCINA");
  if (data.churrasqueira === true) features.add("CHURRASQUEIRA");
  if (features.has("PISCINA")) data.piscina = true;
  if (features.has("CHURRASQUEIRA")) data.churrasqueira = true;
  if (data.piscina === false) features.delete("PISCINA");
  if (data.churrasqueira === false) features.delete("CHURRASQUEIRA");
  data.caracteristicas = [...features];
}

function normalizeText(data) {
  for (const [field, value] of Object.entries(data)) {
    if (typeof value === "string") data[field] = value.trim();
  }
  if (typeof data.cep === "string") data.cep = data.cep.replace(/\D/g, "");
  if (typeof data.estado === "string") data.estado = data.estado.toUpperCase();
  for (const field of Object.keys(TEXT_LIMITS)) {
    if (data[field] === "") data[field] = null;
  }
  for (const field of ["origemCaptacao", "situacaoCaptacao"]) {
    if (data[field] === "") data[field] = null;
  }
}

function validateImovelData(data, { partial = false, previous = null } = {}) {
  normalizeText(data);
  if (
    !normalizeNumberFields(data, NUMBER_FIELDS)
    || !normalizeIntegerFields(data, INTEGER_FIELDS)
    || !normalizeBooleans(data)
    || !normalizeDates(data)
    || hasInvalidEnum(data, "status", STATUS_IMOVEL)
    || hasInvalidEnum(data, "finalidade", FINALIDADES)
    || hasInvalidEnum(data, "tipo", TIPOS_IMOVEL)
    || hasInvalidEnum(data, "ocupacao", OCUPACOES)
    || (data.origemCaptacao != null && hasInvalidEnum(data, "origemCaptacao", ORIGENS_CAPTACAO))
    || (data.situacaoCaptacao != null && hasInvalidEnum(data, "situacaoCaptacao", SITUACOES_CAPTACAO))
  ) {
    return "Existem números, opções ou características inválidas";
  }

  if (!partial) {
    const required = ["titulo", "finalidade", "tipo", "endereco", "bairro", "cidade", "estado"];
    if (required.some((field) => !data[field])) return "Preencha todos os campos obrigatórios";
  }
  if (data.estado && !/^[A-Z]{2}$/.test(data.estado)) return "Informe uma UF válida com duas letras";
  if (data.cep && data.cep.length !== 8) return "Informe um CEP válido com oito dígitos";
  if (data.titulo && data.titulo.length > 160) return "O título deve ter no máximo 160 caracteres";
  if (data.descricao && data.descricao.length > 5000) return "A descrição deve ter no máximo 5.000 caracteres";
  for (const [field, max] of Object.entries(TEXT_LIMITS)) {
    if (data[field] && data[field].length > max) {
      return `O campo ${field} ultrapassa o limite de ${max} caracteres`;
    }
  }
  if (NUMBER_FIELDS.some((field) => data[field] != null && data[field] < 0)) {
    return "Valores e áreas não podem ser negativos";
  }
  if (INTEGER_FIELDS.some((field) => data[field] != null && data[field] < 0)) {
    return "Quantidades não podem ser negativas";
  }

  const shouldValidateValues = !partial
    || Object.prototype.hasOwnProperty.call(data, "finalidade")
    || Object.prototype.hasOwnProperty.call(data, "valorVenda")
    || Object.prototype.hasOwnProperty.call(data, "valorAluguel");
  if (shouldValidateValues) {
    const finalidade = Object.prototype.hasOwnProperty.call(data, "finalidade")
      ? data.finalidade
      : previous?.finalidade;
    const valorVenda = Object.prototype.hasOwnProperty.call(data, "valorVenda")
      ? data.valorVenda
      : previous?.valorVenda;
    const valorAluguel = Object.prototype.hasOwnProperty.call(data, "valorAluguel")
      ? data.valorAluguel
      : previous?.valorAluguel;
    if (finalidade === "VENDA" && !(valorVenda > 0)) return "Informe o valor de venda";
    if (finalidade === "LOCACAO" && !(valorAluguel > 0)) return "Informe o valor de locação";
    if (finalidade === "VENDA_E_LOCACAO" && (!(valorVenda > 0) || !(valorAluguel > 0))) {
      return "Informe os valores de venda e locação";
    }
  }

  if (Object.prototype.hasOwnProperty.call(data, "caracteristicas")) {
    if (
      !Array.isArray(data.caracteristicas)
      || data.caracteristicas.length > 40
      || data.caracteristicas.some((item) => typeof item !== "string" || !CARACTERISTICAS.has(item.trim()))
    ) return "Características inválidas";
    data.caracteristicas = [...new Set(data.caracteristicas.map((item) => item.trim()))];
  }
  syncAmenityFlags(data);

  if (Object.prototype.hasOwnProperty.call(data, "chaveRetirada")) {
    if (data.chaveRetirada) {
      if (!data.chaveRetiradaEm && !previous?.chaveRetiradaEm) {
        data.chaveRetiradaEm = new Date();
      }
    } else if (previous?.chaveRetirada && !data.chaveDevolvidaEm) {
      data.chaveDevolvidaEm = new Date();
    }
  }

  for (const field of NUMBER_GEO_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(data, field)) continue;
    if (data[field] == null || data[field] === "") {
      data[field] = null;
      continue;
    }
    const number = Number(data[field]);
    if (!Number.isFinite(number)) return "Latitude/longitude inválidas";
    data[field] = number;
  }

  if (Object.prototype.hasOwnProperty.call(data, "slug")) {
    data.slug = data.slug ? slugify(data.slug) : null;
  }
  for (const field of ["tourVirtualUrl", "videoUrl"]) {
    if (Object.prototype.hasOwnProperty.call(data, field) && data[field] === "") data[field] = null;
  }

  return null;
}

async function ensureUniqueSlug(empresaId, slug, excludeId = null) {
  if (!slug) return slug;
  let candidate = slug;
  let attempt = 1;
  while (attempt < 50) {
    const existing = await prisma.imovel.findFirst({
      where: {
        empresaId,
        slug: candidate,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!existing) return candidate;
    attempt += 1;
    candidate = `${slug}-${attempt}`;
  }
  return `${slug}-${Date.now()}`;
}

async function validateRelations(data, empresaId) {
  if (!(await belongsToEmpresa(prisma, "usuario", data.corretorId, empresaId))) return false;
  if (!(await belongsToEmpresa(prisma, "usuario", data.angariadorId, empresaId))) return false;
  if (data.proprietarioId == null) return true;
  const proprietario = await prisma.cliente.findFirst({
    where: {
      id: data.proprietarioId,
      empresaId,
      tipo: "PROPRIETARIO",
      ativo: true,
    },
    select: { id: true },
  });
  return Boolean(proprietario);
}

function buildChanges(previous, data) {
  const changes = {};
  for (const [field, value] of Object.entries(data)) {
    const oldValue = previous[field];
    if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
      changes[field] = { anterior: oldValue ?? null, atual: value ?? null };
    }
  }
  return changes;
}

function buildHistoryEvents(previous, data, changes) {
  const events = [];
  if (Object.keys(changes).length > 0) {
    events.push({ acao: "ATUALIZADO", alteracoes: changes });
  }
  if (
    Object.prototype.hasOwnProperty.call(changes, "publicadoSite")
    || Object.prototype.hasOwnProperty.call(changes, "oculto")
    || Object.prototype.hasOwnProperty.call(changes, "emRevisao")
  ) {
    const wasVisible = previous.publicadoSite && !previous.oculto && !previous.emRevisao;
    const nextPublished = Object.prototype.hasOwnProperty.call(data, "publicadoSite")
      ? data.publicadoSite
      : previous.publicadoSite;
    const nextHidden = Object.prototype.hasOwnProperty.call(data, "oculto")
      ? data.oculto
      : previous.oculto;
    const nextReview = Object.prototype.hasOwnProperty.call(data, "emRevisao")
      ? data.emRevisao
      : previous.emRevisao;
    const isVisible = nextPublished && !nextHidden && !nextReview;
    if (!wasVisible && isVisible) {
      events.push({
        acao: "PUBLICADO",
        alteracoes: { publicadoSite: true, oculto: false, emRevisao: false },
      });
    } else if (wasVisible && !isVisible) {
      events.push({
        acao: "RETIRADO_SITE",
        alteracoes: {
          publicadoSite: nextPublished,
          oculto: nextHidden,
          emRevisao: nextReview,
        },
      });
    }
  }
  if (
    Object.prototype.hasOwnProperty.call(changes, "valorVenda")
    || Object.prototype.hasOwnProperty.call(changes, "valorAluguel")
  ) {
    events.push({
      acao: "PRECO_ALTERADO",
      alteracoes: {
        ...(changes.valorVenda && { valorVenda: changes.valorVenda }),
        ...(changes.valorAluguel && { valorAluguel: changes.valorAluguel }),
      },
    });
  }
  if (Object.prototype.hasOwnProperty.call(changes, "proprietarioId")) {
    events.push({ acao: "PROPRIETARIO_ALTERADO", alteracoes: changes.proprietarioId });
  }
  if (Object.prototype.hasOwnProperty.call(changes, "chaveRetirada")) {
    if (data.chaveRetirada) {
      events.push({
        acao: "CHAVE_RETIRADA",
        alteracoes: {
          retiradoPor: data.chaveRetiradaPor || previous.chaveRetiradaPor || null,
          ocorridoEm: data.chaveRetiradaEm || new Date(),
          observacao: data.chaveObservacoes || null,
        },
      });
    } else if (previous.chaveRetirada) {
      events.push({
        acao: "CHAVE_DEVOLVIDA",
        alteracoes: {
          devolvidoPor: data.chaveRetiradaPor || null,
          ocorridoEm: data.chaveDevolvidaEm || new Date(),
          observacao: data.chaveObservacoes || null,
        },
      });
    }
  }
  return events;
}

async function registerChaveHistorico(tx, {
  empresaId, imovelId, usuarioId, previous, data, changes,
}) {
  if (!Object.prototype.hasOwnProperty.call(changes, "chaveRetirada")) return null;
  if (data.chaveRetirada) {
    return tx.imovelChaveHistorico.create({
      data: {
        empresaId,
        imovelId,
        usuarioId,
        acao: "RETIRADA",
        retiradoPor: data.chaveRetiradaPor || previous.chaveRetiradaPor || null,
        observacao: data.chaveObservacoes || null,
        ocorridoEm: data.chaveRetiradaEm || new Date(),
      },
    });
  }
  if (previous.chaveRetirada) {
    return tx.imovelChaveHistorico.create({
      data: {
        empresaId,
        imovelId,
        usuarioId,
        acao: "DEVOLUCAO",
        devolvidoPor: data.chaveRetiradaPor || null,
        observacao: data.chaveObservacoes || null,
        ocorridoEm: data.chaveDevolvidaEm || new Date(),
      },
    });
  }
  return null;
}

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

function parseOptionalInteger(value) {
  const number = parseOptionalNumber(value);
  return number == null || Number.isInteger(number) ? number : null;
}

function relationSelect() {
  return {
    corretor: { select: { id: true, nome: true } },
    angariador: { select: { id: true, nome: true } },
    proprietario: {
      select: { id: true, nome: true, telefone: true, whatsapp: true, email: true },
    },
    fotos: {
      orderBy: [{ principal: "desc" }, { ordem: "asc" }],
    },
  };
}

function listRelationSelect() {
  return {
    corretor: { select: { id: true, nome: true } },
    angariador: { select: { id: true, nome: true } },
    proprietario: { select: { id: true, nome: true } },
    fotos: {
      take: 1,
      orderBy: [{ principal: "desc" }, { ordem: "asc" }],
    },
  };
}

export async function criarImovel(req, res) {
  try {
    const scope = empresaScope(req);
    const data = normalizeRelationIds(
      pickFields(req.body, IMOVEL_FIELDS),
      ["corretorId", "proprietarioId", "angariadorId"],
    );
    data.corretorId = req.usuario.tipo === "CORRETOR"
      ? req.usuario.id
      : data.corretorId ?? req.usuario.id;
    data.status = "DISPONIVEL";

    const validationError = validateImovelData(data);
    if (validationError) return res.status(400).json({ erro: validationError });
    if (!(await validateRelations(data, scope.empresaId))) {
      return res.status(400).json({ erro: "Proprietário ou corretor inválido para esta empresa" });
    }

    const codigo = data.codigo || gerarCodigoImovel();
    data.slug = await ensureUniqueSlug(
      scope.empresaId,
      data.slug || buildImovelSlug({ titulo: data.titulo, codigo }),
    );
    if (data.publicadoSite == null) data.publicadoSite = true;
    const imovel = await prisma.$transaction(async (tx) => {
      const created = await tx.imovel.create({
        data: { ...data, ...scope, codigo },
        include: relationSelect(),
      });
      await tx.imovelHistorico.create({
        data: {
          ...scope,
          imovelId: created.id,
          usuarioId: req.usuario.id,
          acao: "CRIADO",
          alteracoes: { codigo, titulo: created.titulo },
        },
      });
      return created;
    });
    return res.status(201).json(imovel);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao cadastrar imóvel");
  }
}

export async function listarImoveis(req, res) {
  try {
    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, 12, 100);
    if (!page || !limit) return res.status(400).json({ erro: "Paginação inválida" });

    const {
      busca, status, finalidade, tipo, cidade, bairro, ordenacao = "recentes",
      corretorId, proprietarioId, caracteristicas, ocupacao,
    } = req.query;
    if (status && !STATUS_IMOVEL.includes(status)) return res.status(400).json({ erro: "Status inválido" });
    if (finalidade && !FINALIDADES.includes(finalidade)) return res.status(400).json({ erro: "Finalidade inválida" });
    if (tipo && !TIPOS_IMOVEL.includes(tipo)) return res.status(400).json({ erro: "Tipo de imóvel inválido" });
    if (ocupacao && !OCUPACOES.includes(ocupacao)) return res.status(400).json({ erro: "Ocupação inválida" });
    if (!SORT_OPTIONS[ordenacao]) return res.status(400).json({ erro: "Ordenação inválida" });

    const ownerId = parsePositiveInteger(proprietarioId, undefined);
    const brokerId = parsePositiveInteger(corretorId, undefined);
    const valorMin = parseOptionalNumber(req.query.valorMin);
    const valorMax = parseOptionalNumber(req.query.valorMax);
    const quartosMin = parseOptionalInteger(req.query.quartosMin);
    const banheirosMin = parseOptionalInteger(req.query.banheirosMin);
    const vagasMin = parseOptionalInteger(req.query.vagasMin);
    if ([ownerId, brokerId, valorMin, valorMax, quartosMin, banheirosMin, vagasMin].includes(null)) {
      return res.status(400).json({ erro: "Um ou mais filtros são inválidos" });
    }
    if (valorMin != null && valorMax != null && valorMax < valorMin) {
      return res.status(400).json({ erro: "O valor máximo deve ser maior ou igual ao mínimo" });
    }
    if (req.usuario.tipo === "CORRETOR" && brokerId && brokerId !== req.usuario.id) {
      return res.status(403).json({ erro: "Corretores só podem consultar o próprio portfólio" });
    }

    const parseBoolQuery = (value) => {
      if (value === "true") return true;
      if (value === "false") return false;
      if (value == null || value === "") return undefined;
      return null;
    };
    const exclusividade = parseBoolQuery(req.query.exclusividade);
    const aceitaFinanciamento = parseBoolQuery(req.query.aceitaFinanciamento);
    const aceitaPermuta = parseBoolQuery(req.query.aceitaPermuta);
    const chaveRetirada = parseBoolQuery(req.query.chaveRetirada);
    const piscina = parseBoolQuery(req.query.piscina);
    const churrasqueira = parseBoolQuery(req.query.churrasqueira);
    if ([exclusividade, aceitaFinanciamento, aceitaPermuta, chaveRetirada, piscina, churrasqueira].includes(null)) {
      return res.status(400).json({ erro: "Um ou mais filtros booleanos são inválidos" });
    }

    const selectedFeatures = typeof caracteristicas === "string"
      ? caracteristicas.split(",").map((item) => item.trim()).filter(Boolean)
      : [];
    if (selectedFeatures.some((item) => !CARACTERISTICAS.has(item))) {
      return res.status(400).json({ erro: "Uma ou mais características são inválidas" });
    }

    const arrayFeatures = selectedFeatures.filter((item) => item !== "PISCINA" && item !== "CHURRASQUEIRA");
    const wantsPiscina = piscina === true || selectedFeatures.includes("PISCINA");
    const wantsChurrasqueira = churrasqueira === true || selectedFeatures.includes("CHURRASQUEIRA");

    const priceFilter = {};
    if (valorMin != null) priceFilter.gte = valorMin;
    if (valorMax != null) priceFilter.lte = valorMax;

    const includeInactive = req.query.incluirInativos === "true" || req.query.ativo === "false";
    const onlyInactive = req.query.ativo === "false";
    const andFilters = [];

    if (Object.keys(priceFilter).length > 0) {
      andFilters.push({ OR: [{ valorVenda: priceFilter }, { valorAluguel: priceFilter }] });
    }
    if (wantsPiscina) {
      andFilters.push({ OR: [{ piscina: true }, { caracteristicas: { has: "PISCINA" } }] });
    }
    if (wantsChurrasqueira) {
      andFilters.push({ OR: [{ churrasqueira: true }, { caracteristicas: { has: "CHURRASQUEIRA" } }] });
    }
    if (busca) {
      const term = busca.trim();
      andFilters.push({
        OR: [
          { titulo: { contains: term, mode: "insensitive" } },
          { codigo: { contains: term, mode: "insensitive" } },
          { bairro: { contains: term, mode: "insensitive" } },
          { cidade: { contains: term, mode: "insensitive" } },
          { endereco: { contains: term, mode: "insensitive" } },
        ],
      });
    }

    const where = {
      ...ownershipScope(req),
      ...(onlyInactive ? { ativo: false } : includeInactive ? {} : { ativo: true }),
      ...(status && { status }),
      ...(finalidade && { finalidade }),
      ...(tipo && { tipo }),
      ...(ocupacao && { ocupacao }),
      ...(cidade && { cidade: { contains: cidade.trim(), mode: "insensitive" } }),
      ...(bairro && { bairro: { contains: bairro.trim(), mode: "insensitive" } }),
      ...(req.usuario.tipo !== "CORRETOR" && brokerId && { corretorId: brokerId }),
      ...(ownerId && { proprietarioId: ownerId }),
      ...(quartosMin != null && { quartos: { gte: quartosMin } }),
      ...(banheirosMin != null && { banheiros: { gte: banheirosMin } }),
      ...(vagasMin != null && { vagas: { gte: vagasMin } }),
      ...(exclusividade != null && { exclusividade }),
      ...(aceitaFinanciamento != null && { aceitaFinanciamento }),
      ...(aceitaPermuta != null && { aceitaPermuta }),
      ...(chaveRetirada != null && { chaveRetirada }),
      ...(arrayFeatures.length > 0 && { caracteristicas: { hasEvery: arrayFeatures } }),
      ...(andFilters.length > 0 && { AND: andFilters }),
    };

    const [data, total] = await prisma.$transaction([
      prisma.imovel.findMany({
        where,
        include: listRelationSelect(),
        orderBy: SORT_OPTIONS[ordenacao],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.imovel.count({ where }),
    ]);

    return res.json({
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao listar imóveis");
  }
}

export async function listarOpcoesImovel(req, res) {
  try {
    const scope = ownershipScope(req);
    const [proprietarios, corretores] = await Promise.all([
      prisma.cliente.findMany({
        where: { ...scope, tipo: "PROPRIETARIO", ativo: true },
        select: { id: true, nome: true, telefone: true },
        orderBy: { nome: "asc" },
        take: 500,
      }),
      prisma.usuario.findMany({
        where: {
          empresaId: req.usuario.empresaId,
          ativo: true,
          ...(req.usuario.tipo === "CORRETOR" && { id: req.usuario.id }),
        },
        select: { id: true, nome: true, tipo: true },
        orderBy: { nome: "asc" },
        take: 200,
      }),
    ]);
    return res.json({
      proprietarios,
      corretores,
      tipos: TIPOS_IMOVEL,
      finalidades: FINALIDADES,
      status: STATUS_IMOVEL,
      ocupacoes: OCUPACOES,
      origensCaptacao: ORIGENS_CAPTACAO,
      situacoesCaptacao: SITUACOES_CAPTACAO,
      caracteristicas: [...CARACTERISTICAS],
      filtrosSite: FILTROS_SITE,
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao carregar opções de imóveis");
  }
}

export async function buscarImovel(req, res) {
  try {
    const imovel = await prisma.imovel.findFirst({
      where: { id: Number(req.params.id), ...ownershipScope(req) },
      include: {
        ...relationSelect(),
        contratos: {
          where: { empresaId: req.usuario.empresaId },
          select: {
            id: true, numero: true, tipo: true, status: true, valor: true,
            cliente: { select: { id: true, nome: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        historico: {
          take: 12,
          orderBy: { createdAt: "desc" },
          include: { usuario: { select: { id: true, nome: true } } },
        },
        chaveHistorico: {
          take: 20,
          orderBy: { ocorridoEm: "desc" },
          include: { usuario: { select: { id: true, nome: true } } },
        },
      },
    });
    if (!imovel) return res.status(404).json({ erro: "Imóvel não encontrado" });
    return res.json(imovel);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao buscar imóvel");
  }
}

export async function reativarImovel(req, res) {
  try {
    const scope = ownershipScope(req);
    const imovel = await prisma.imovel.findFirst({
      where: { id: Number(req.params.id), ativo: false, ...scope },
      select: { id: true, titulo: true },
    });
    if (!imovel) return res.status(404).json({ erro: "Imóvel inativo não encontrado" });

    const reativado = await prisma.$transaction(async (tx) => {
      const updated = await tx.imovel.update({
        where: { id: imovel.id, ...scope },
        data: { ativo: true, status: "DISPONIVEL" },
        include: relationSelect(),
      });
      await tx.imovelHistorico.create({
        data: {
          empresaId: req.usuario.empresaId,
          imovelId: imovel.id,
          usuarioId: req.usuario.id,
          acao: "REATIVADO",
          alteracoes: { titulo: imovel.titulo },
        },
      });
      return updated;
    });
    return res.json(reativado);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao reativar imóvel");
  }
}

export async function atualizarImovel(req, res) {
  try {
    const scope = ownershipScope(req);
    const previous = await prisma.imovel.findFirst({
      where: { id: Number(req.params.id), ativo: true, ...scope },
    });
    if (!previous) return res.status(404).json({ erro: "Imóvel não encontrado" });

    const data = normalizeRelationIds(
      pickFields(req.body, IMOVEL_FIELDS),
      ["corretorId", "proprietarioId", "angariadorId"],
    );
    if (req.usuario.tipo === "CORRETOR") data.corretorId = req.usuario.id;
    if (["VENDIDO", "ALUGADO", "INATIVO"].includes(data.status)) {
      return res.status(400).json({ erro: "Este status é controlado pelo contrato ou pela desativação" });
    }
    const validationError = validateImovelData(data, { partial: true, previous });
    if (validationError) return res.status(400).json({ erro: validationError });
    if (!(await validateRelations(data, req.usuario.empresaId))) {
      return res.status(400).json({ erro: "Proprietário ou corretor inválido para esta empresa" });
    }

    if (data.status && data.status !== previous.status) {
      const activeContract = await prisma.contrato.findFirst({
        where: {
          empresaId: req.usuario.empresaId,
          imovelId: previous.id,
          status: "ATIVO",
          tipo: { in: ["VENDA", "ALUGUEL"] },
        },
        select: { id: true },
      });
      if (activeContract) {
        return res.status(409).json({ erro: "O status deste imóvel é controlado por um contrato ativo" });
      }
    }

    if (Object.prototype.hasOwnProperty.call(data, "slug") || !previous.slug) {
      data.slug = await ensureUniqueSlug(
        req.usuario.empresaId,
        data.slug || previous.slug || buildImovelSlug({
          titulo: data.titulo || previous.titulo,
          codigo: data.codigo || previous.codigo,
          id: previous.id,
        }),
        previous.id,
      );
    }

    const changes = buildChanges(previous, data);
    const historyEvents = buildHistoryEvents(previous, data, changes);
    const imovel = await prisma.$transaction(async (tx) => {
      const updated = await tx.imovel.update({
        where: { id: previous.id, ...scope },
        data,
        include: relationSelect(),
      });
      for (const event of historyEvents) {
        await tx.imovelHistorico.create({
          data: {
            empresaId: req.usuario.empresaId,
            imovelId: previous.id,
            usuarioId: req.usuario.id,
            acao: event.acao,
            alteracoes: event.alteracoes,
          },
        });
      }
      await registerChaveHistorico(tx, {
        empresaId: req.usuario.empresaId,
        imovelId: previous.id,
        usuarioId: req.usuario.id,
        previous,
        data,
        changes,
      });
      return updated;
    });
    return res.json(imovel);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao atualizar imóvel");
  }
}

export async function excluirImovel(req, res) {
  try {
    const scope = ownershipScope(req);
    const imovel = await prisma.imovel.findFirst({
      where: { id: Number(req.params.id), ativo: true, ...scope },
      select: { id: true, titulo: true },
    });
    if (!imovel) return res.status(404).json({ erro: "Imóvel não encontrado" });

    const activeContract = await prisma.contrato.findFirst({
      where: { empresaId: req.usuario.empresaId, imovelId: imovel.id, status: "ATIVO" },
      select: { id: true },
    });
    if (activeContract) {
      return res.status(409).json({ erro: "Não é possível desativar um imóvel com contrato ativo" });
    }

    await prisma.$transaction([
      prisma.imovel.update({
        where: { id: imovel.id, ...scope },
        data: { ativo: false, status: "INATIVO" },
      }),
      prisma.imovelHistorico.create({
        data: {
          empresaId: req.usuario.empresaId,
          imovelId: imovel.id,
          usuarioId: req.usuario.id,
          acao: "DESATIVADO",
          alteracoes: { titulo: imovel.titulo },
        },
      }),
    ]);
    return res.json({ mensagem: "Imóvel desativado com sucesso" });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao excluir imóvel");
  }
}

export async function adicionarFotos(req, res) {
  const uploadedPaths = (req.files || []).map((file) => file.path);
  try {
    if (!req.files?.length) {
      return res.status(400).json({ erro: "Selecione ao menos uma foto" });
    }
    const validSignatures = await Promise.all(req.files.map(hasValidImageSignature));
    if (validSignatures.some((valid) => !valid)) {
      await removeFiles(uploadedPaths);
      return res.status(400).json({ erro: "Uma ou mais fotos possuem conteúdo inválido" });
    }

    const fotos = await prisma.$transaction(async (tx) => {
      const existingCount = await tx.imovelFoto.count({
        where: { empresaId: req.usuario.empresaId, imovelId: req.imovel.id },
      });
      if (existingCount + req.files.length > MAX_PROPERTY_IMAGES) {
        const error = new Error("Limite de fotos excedido");
        error.code = "PHOTO_LIMIT";
        throw error;
      }
      const created = [];
      for (const [index, file] of req.files.entries()) {
        const foto = await tx.imovelFoto.create({
          data: {
            empresaId: req.usuario.empresaId,
            imovelId: req.imovel.id,
            url: "",
            nomeArquivo: file.filename,
            mimeType: file.mimetype,
            tamanho: file.size,
            ordem: existingCount + index,
            principal: existingCount === 0 && index === 0,
          },
        });
        created.push(await tx.imovelFoto.update({
          where: { id: foto.id, empresaId: req.usuario.empresaId },
          data: { url: `/imoveis/${req.imovel.id}/fotos/${foto.id}/arquivo` },
        }));
      }
      await tx.imovelHistorico.create({
        data: {
          empresaId: req.usuario.empresaId,
          imovelId: req.imovel.id,
          usuarioId: req.usuario.id,
          acao: "FOTO_ADICIONADA",
          alteracoes: { quantidade: created.length },
        },
      });
      return created;
    }, { isolationLevel: "Serializable" });
    return res.status(201).json(fotos);
  } catch (error) {
    await removeFiles(uploadedPaths);
    if (error.code === "PHOTO_LIMIT") {
      return res.status(400).json({ erro: `Cada imóvel pode ter no máximo ${MAX_PROPERTY_IMAGES} fotos` });
    }
    return sendControllerError(res, error, "Erro ao adicionar fotos");
  }
}

export async function definirFotoPrincipal(req, res) {
  try {
    const fotoId = Number(req.params.fotoId);
    const foto = await prisma.imovelFoto.findFirst({
      where: {
        id: fotoId,
        empresaId: req.usuario.empresaId,
        imovelId: req.imovel.id,
      },
      select: { id: true },
    });
    if (!foto) return res.status(404).json({ erro: "Foto não encontrada" });

    const principal = await prisma.$transaction(async (tx) => {
      await tx.imovelFoto.updateMany({
        where: { empresaId: req.usuario.empresaId, imovelId: req.imovel.id },
        data: { principal: false },
      });
      const updated = await tx.imovelFoto.update({
        where: { id: foto.id, empresaId: req.usuario.empresaId },
        data: { principal: true },
      });
      await tx.imovelHistorico.create({
        data: {
          empresaId: req.usuario.empresaId,
          imovelId: req.imovel.id,
          usuarioId: req.usuario.id,
          acao: "FOTO_PRINCIPAL",
          alteracoes: { fotoId: foto.id },
        },
      });
      return updated;
    }, { isolationLevel: "Serializable" });
    return res.json(principal);
  } catch (error) {
    return sendControllerError(res, error, "Erro ao definir foto principal");
  }
}

export async function obterArquivoFoto(req, res, next) {
  try {
    const foto = await prisma.imovelFoto.findFirst({
      where: {
        id: Number(req.params.fotoId),
        empresaId: req.usuario.empresaId,
        imovelId: req.imovel.id,
      },
      select: { nomeArquivo: true, mimeType: true },
    });
    if (!foto || foto.nomeArquivo.startsWith("legacy-")) {
      return res.status(404).json({ erro: "Arquivo não encontrado" });
    }
    res.type(foto.mimeType);
    res.setHeader("Cache-Control", "private, max-age=3600");
    return res.sendFile(
      propertyImagePath(req.usuario.empresaId, req.imovel.id, foto.nomeArquivo),
      (error) => {
        if (error && !res.headersSent) next(error);
      },
    );
  } catch (error) {
    return next(error);
  }
}

async function compactPhotoOrder(tx, empresaId, imovelId) {
  const photos = await tx.imovelFoto.findMany({
    where: { empresaId, imovelId },
    orderBy: [{ ordem: "asc" }, { id: "asc" }],
    select: { id: true },
  });
  for (const [index, photo] of photos.entries()) {
    await tx.imovelFoto.update({
      where: { id: photo.id, empresaId },
      data: { ordem: index + 1000 },
    });
  }
  for (const [index, photo] of photos.entries()) {
    await tx.imovelFoto.update({
      where: { id: photo.id, empresaId },
      data: { ordem: index },
    });
  }
  return photos;
}

export async function excluirFoto(req, res) {
  try {
    const foto = await prisma.imovelFoto.findFirst({
      where: {
        id: Number(req.params.fotoId),
        empresaId: req.usuario.empresaId,
        imovelId: req.imovel.id,
      },
    });
    if (!foto) return res.status(404).json({ erro: "Foto não encontrada" });

    await prisma.$transaction(async (tx) => {
      await tx.imovelFoto.delete({
        where: { id: foto.id, empresaId: req.usuario.empresaId },
      });
      await compactPhotoOrder(tx, req.usuario.empresaId, req.imovel.id);
      if (foto.principal) {
        const nextPhoto = await tx.imovelFoto.findFirst({
          where: { empresaId: req.usuario.empresaId, imovelId: req.imovel.id },
          orderBy: { ordem: "asc" },
          select: { id: true },
        });
        if (nextPhoto) {
          await tx.imovelFoto.update({
            where: { id: nextPhoto.id, empresaId: req.usuario.empresaId },
            data: { principal: true },
          });
        }
      }
      await tx.imovelHistorico.create({
        data: {
          empresaId: req.usuario.empresaId,
          imovelId: req.imovel.id,
          usuarioId: req.usuario.id,
          acao: "FOTO_REMOVIDA",
          alteracoes: { fotoId: foto.id },
        },
      });
    }, { isolationLevel: "Serializable" });

    if (!foto.nomeArquivo.startsWith("legacy-")) {
      await removeFiles([
        propertyImagePath(req.usuario.empresaId, req.imovel.id, foto.nomeArquivo),
      ]);
    }
    return res.json({ mensagem: "Foto removida com sucesso" });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao remover foto");
  }
}

export async function reordenarFotos(req, res) {
  try {
    const fotoIds = Array.isArray(req.body?.fotoIds) ? req.body.fotoIds.map(Number) : null;
    if (!fotoIds?.length || fotoIds.some((id) => !Number.isInteger(id) || id <= 0)) {
      return res.status(400).json({ erro: "Informe a ordem completa das fotos" });
    }
    if (new Set(fotoIds).size !== fotoIds.length) {
      return res.status(400).json({ erro: "A ordem das fotos contém identificadores duplicados" });
    }

    const fotos = await prisma.$transaction(async (tx) => {
      const existing = await tx.imovelFoto.findMany({
        where: { empresaId: req.usuario.empresaId, imovelId: req.imovel.id },
        select: { id: true },
        orderBy: { ordem: "asc" },
      });
      if (existing.length !== fotoIds.length) {
        const error = new Error("Ordem incompleta");
        error.code = "PHOTO_ORDER";
        throw error;
      }
      const existingIds = new Set(existing.map((item) => item.id));
      if (fotoIds.some((id) => !existingIds.has(id))) {
        const error = new Error("Ordem inválida");
        error.code = "PHOTO_ORDER";
        throw error;
      }

      for (const [index, fotoId] of fotoIds.entries()) {
        await tx.imovelFoto.update({
          where: { id: fotoId, empresaId: req.usuario.empresaId },
          data: { ordem: index + 1000 },
        });
      }
      for (const [index, fotoId] of fotoIds.entries()) {
        await tx.imovelFoto.update({
          where: { id: fotoId, empresaId: req.usuario.empresaId },
          data: { ordem: index },
        });
      }
      await tx.imovelHistorico.create({
        data: {
          empresaId: req.usuario.empresaId,
          imovelId: req.imovel.id,
          usuarioId: req.usuario.id,
          acao: "FOTO_REORDENADA",
          alteracoes: { fotoIds },
        },
      });
      return tx.imovelFoto.findMany({
        where: { empresaId: req.usuario.empresaId, imovelId: req.imovel.id },
        orderBy: [{ principal: "desc" }, { ordem: "asc" }],
      });
    }, { isolationLevel: "Serializable" });

    return res.json(fotos);
  } catch (error) {
    if (error.code === "PHOTO_ORDER") {
      return res.status(400).json({ erro: "Envie todos os IDs das fotos do imóvel, sem duplicar" });
    }
    return sendControllerError(res, error, "Erro ao reordenar fotos");
  }
}

export async function listarHistoricoImovel(req, res) {
  try {
    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, 20, 100);
    if (!page || !limit) return res.status(400).json({ erro: "Paginação inválida" });

    const where = {
      empresaId: req.usuario.empresaId,
      imovelId: req.imovel.id,
    };
    const [data, total] = await prisma.$transaction([
      prisma.imovelHistorico.findMany({
        where,
        include: { usuario: { select: { id: true, nome: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.imovelHistorico.count({ where }),
    ]);
    return res.json({
      data,
      meta: { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) },
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao carregar histórico");
  }
}

export async function listarHistoricoChavesImovel(req, res) {
  try {
    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, 20, 100);
    if (!page || !limit) return res.status(400).json({ erro: "Paginação inválida" });

    const where = {
      empresaId: req.usuario.empresaId,
      imovelId: req.imovel.id,
    };
    const [data, total] = await prisma.$transaction([
      prisma.imovelChaveHistorico.findMany({
        where,
        include: { usuario: { select: { id: true, nome: true } } },
        orderBy: { ocorridoEm: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.imovelChaveHistorico.count({ where }),
    ]);
    return res.json({
      data,
      meta: { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) },
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao carregar histórico de chaves");
  }
}
