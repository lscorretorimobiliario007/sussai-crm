import fs from "node:fs";
import path from "node:path";
import prisma from "../config/prisma.js";
import { EMPRESA_UPLOAD_ROOT } from "../config/uploads.js";
import { propertyImagePath } from "../services/imovelImageStorage.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { sendControllerError } from "../utils/security.js";
import { buildImovelSlug, slugify } from "../utils/slug.js";
import { sanitizeEmpresa } from "./empresaController.js";

const PUBLIC_STATUSES = ["DISPONIVEL", "RESERVADO"];
const TIPOS_COMERCIAIS = ["COMERCIAL", "SALA_COMERCIAL", "GALPAO"];

export const publicLeadLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, keyPrefix: "public-lead" });
export const publicReadLimit = rateLimit({ windowMs: 60 * 1000, max: 120, keyPrefix: "public-read" });

function siteEmpresaId() {
  const raw = process.env.SITE_EMPRESA_ID || process.env.PUBLIC_SITE_EMPRESA_ID;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function requireEmpresa(res) {
  const empresaId = siteEmpresaId();
  if (!empresaId) {
    res.status(503).json({
      erro: "SITE_EMPRESA_ID não configurado no backend. Defina o ID da empresa Top Conceição.",
    });
    return null;
  }
  return empresaId;
}

async function requireEmpresaSiteAtivo(res) {
  const empresaId = requireEmpresa(res);
  if (!empresaId) return null;
  const empresa = await prisma.empresa.findFirst({
    where: { id: empresaId, ativo: true },
    select: { id: true, siteAtivo: true },
  });
  if (!empresa) {
    res.status(404).json({ erro: "Empresa não encontrada" });
    return null;
  }
  if (empresa.siteAtivo === false) {
    res.status(503).json({ erro: "Site temporariamente indisponível" });
    return null;
  }
  return empresaId;
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

function parseBool(value) {
  if (value === "true" || value === true) return true;
  if (value === "false" || value === false) return false;
  if (value == null || value === "") return undefined;
  return null;
}

function publicPhotoUrl(imovelId, fotoId) {
  return `/public/imoveis/${imovelId}/fotos/${fotoId}`;
}

function mapFoto(foto, imovelId) {
  return {
    id: foto.id,
    url: publicPhotoUrl(imovelId, foto.id),
    principal: foto.principal,
    ordem: foto.ordem,
  };
}

function sanitizeImovel(imovel, { detail = false } = {}) {
  if (!imovel) return null;
  const valor = imovel.finalidade === "LOCACAO"
    ? imovel.valorAluguel
    : (imovel.valorVenda ?? imovel.valorAluguel);
  const fotos = (imovel.fotos || []).map((foto) => mapFoto(foto, imovel.id));
  const base = {
    id: imovel.id,
    slug: imovel.slug || buildImovelSlug(imovel),
    codigo: imovel.codigo,
    titulo: imovel.titulo,
    descricao: imovel.descricao,
    finalidade: imovel.finalidade,
    tipo: imovel.tipo,
    status: imovel.status,
    valorVenda: imovel.valorVenda,
    valorAluguel: imovel.valorAluguel,
    valor,
    condominio: imovel.condominio,
    iptu: detail ? imovel.iptu : undefined,
    bairro: imovel.bairro,
    cidade: imovel.cidade,
    estado: imovel.estado,
    endereco: detail ? imovel.endereco : undefined,
    numero: detail ? imovel.numero : undefined,
    complemento: detail ? imovel.complemento : undefined,
    cep: detail ? imovel.cep : undefined,
    quartos: imovel.quartos,
    suites: imovel.suites,
    banheiros: imovel.banheiros,
    vagas: imovel.vagas,
    areaUtil: imovel.areaUtil,
    areaConstruida: detail ? imovel.areaConstruida : undefined,
    areaTerreno: detail ? imovel.areaTerreno : undefined,
    piscina: imovel.piscina,
    churrasqueira: imovel.churrasqueira,
    caracteristicas: imovel.caracteristicas || [],
    exclusividade: imovel.exclusividade,
    aceitaFinanciamento: imovel.aceitaFinanciamento,
    aceitaFgts: imovel.aceitaFgts,
    aceitaPermuta: imovel.aceitaPermuta,
    aceitaVeiculo: imovel.aceitaVeiculo,
    estudaProposta: imovel.estudaProposta,
    ocupacao: imovel.ocupacao,
    destaqueSite: imovel.destaqueSite,
    lancamento: imovel.lancamento,
    altoPadrao: imovel.altoPadrao || imovel.exclusividade,
    seoTitulo: detail ? imovel.seoTitulo : undefined,
    seoDescricao: detail ? imovel.seoDescricao : undefined,
    tourVirtualUrl: imovel.tourVirtualUrl,
    videoUrl: imovel.videoUrl,
    plantaUrl: detail ? imovel.plantaUrl : undefined,
    latitude: imovel.latitude,
    longitude: imovel.longitude,
    image: fotos[0]?.url || null,
    gallery: fotos,
    corretor: imovel.corretor
      ? {
        id: imovel.corretor.id,
        nome: imovel.corretor.nome,
        telefone: imovel.corretor.telefone || null,
        creci: imovel.corretor.creci || null,
        fotoUrl: imovel.corretor.fotoUrl || null,
      }
      : null,
    createdAt: imovel.createdAt,
    updatedAt: imovel.updatedAt,
  };
  return base;
}

function baseWhere(empresaId) {
  return {
    empresaId,
    ativo: true,
    publicadoSite: true,
    oculto: false,
    emRevisao: false,
    status: { in: PUBLIC_STATUSES },
  };
}

async function ensureSlugs(empresaId) {
  const missing = await prisma.imovel.findMany({
    where: { empresaId, OR: [{ slug: null }, { slug: "" }] },
    select: { id: true, titulo: true, codigo: true },
    take: 200,
  });
  for (const item of missing) {
    let slug = buildImovelSlug(item);
    const exists = await prisma.imovel.findFirst({
      where: { empresaId, slug, NOT: { id: item.id } },
      select: { id: true },
    });
    if (exists) slug = `${slug}-${item.id}`;
    await prisma.imovel.update({ where: { id: item.id }, data: { slug } });
  }
}

export async function listarImoveisPublicos(req, res) {
  try {
    const empresaId = await requireEmpresaSiteAtivo(res);
    if (!empresaId) return undefined;
    await ensureSlugs(empresaId);

    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, 12, 48);
    if (!page || !limit) return res.status(400).json({ erro: "Paginação inválida" });

    const {
      busca, finalidade, tipo, cidade, bairro, ordenacao = "recentes", secao,
    } = req.query;

    const valorMin = parseOptionalNumber(req.query.valorMin);
    const valorMax = parseOptionalNumber(req.query.valorMax);
    const quartosMin = parseOptionalNumber(req.query.quartosMin);
    const destaqueSite = parseBool(req.query.destaqueSite);
    const lancamento = parseBool(req.query.lancamento);
    const altoPadrao = parseBool(req.query.altoPadrao);
    const comercial = parseBool(req.query.comercial);

    if ([valorMin, valorMax, quartosMin].includes(null)
      || [destaqueSite, lancamento, altoPadrao, comercial].includes(null)) {
      return res.status(400).json({ erro: "Filtros inválidos" });
    }

    const selectedFeatures = typeof req.query.caracteristicas === "string"
      ? req.query.caracteristicas.split(",").map((item) => item.trim()).filter(Boolean)
      : [];

    const sortMap = {
      recentes: { createdAt: "desc" },
      antigos: { createdAt: "asc" },
      maior_valor: { valorVenda: "desc" },
      menor_valor: { valorVenda: "asc" },
      titulo: { titulo: "asc" },
    };
    if (!sortMap[ordenacao]) return res.status(400).json({ erro: "Ordenação inválida" });

    const andFilters = [];
    const priceFilter = {};
    if (valorMin != null) priceFilter.gte = valorMin;
    if (valorMax != null) priceFilter.lte = valorMax;
    if (Object.keys(priceFilter).length > 0) {
      andFilters.push({ OR: [{ valorVenda: priceFilter }, { valorAluguel: priceFilter }] });
    }
    if (busca) {
      const term = String(busca).trim();
      andFilters.push({
        OR: [
          { titulo: { contains: term, mode: "insensitive" } },
          { codigo: { contains: term, mode: "insensitive" } },
          { bairro: { contains: term, mode: "insensitive" } },
          { cidade: { contains: term, mode: "insensitive" } },
          { slug: { contains: slugify(term), mode: "insensitive" } },
        ],
      });
    }

    const where = {
      ...baseWhere(empresaId),
      ...(finalidade && { finalidade }),
      ...(tipo && { tipo }),
      ...(cidade && { cidade: { contains: String(cidade).trim(), mode: "insensitive" } }),
      ...(bairro && { bairro: { contains: String(bairro).trim(), mode: "insensitive" } }),
      ...(quartosMin != null && { quartos: { gte: Number(quartosMin) } }),
      ...(destaqueSite === true && { destaqueSite: true }),
      ...(lancamento === true && { lancamento: true }),
      ...(altoPadrao === true && { OR: [{ altoPadrao: true }, { exclusividade: true }] }),
      ...(comercial === true && {
        OR: [{ publicacaoComercial: true }, { tipo: { in: TIPOS_COMERCIAIS } }],
      }),
      ...(secao === "destaque" && { destaqueSite: true }),
      ...(secao === "lancamentos" && { lancamento: true }),
      ...(secao === "alto-padrao" && { OR: [{ altoPadrao: true }, { exclusividade: true }] }),
      ...(secao === "comercial" && {
        OR: [{ publicacaoComercial: true }, { tipo: { in: TIPOS_COMERCIAIS } }],
      }),
      ...(selectedFeatures.length > 0 && { caracteristicas: { hasEvery: selectedFeatures } }),
      ...(andFilters.length > 0 && { AND: andFilters }),
    };

    const [data, total] = await prisma.$transaction([
      prisma.imovel.findMany({
        where,
        include: {
          corretor: { select: { id: true, nome: true, telefone: true, creci: true, fotoUrl: true } },
          fotos: {
            take: 1,
            orderBy: [{ principal: "desc" }, { ordem: "asc" }],
            select: { id: true, principal: true, ordem: true },
          },
        },
        orderBy: sortMap[ordenacao],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.imovel.count({ where }),
    ]);

    return res.json({
      data: data.map((item) => sanitizeImovel(item)),
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao listar imóveis públicos");
  }
}

export async function buscarImovelPublico(req, res) {
  try {
    const empresaId = await requireEmpresaSiteAtivo(res);
    if (!empresaId) return undefined;
    await ensureSlugs(empresaId);

    const key = String(req.params.slugOrCodigo || "").trim();
    if (!key) return res.status(400).json({ erro: "Identificador inválido" });

    const imovel = await prisma.imovel.findFirst({
      where: {
        ...baseWhere(empresaId),
        OR: [
          { slug: key },
          { codigo: { equals: key, mode: "insensitive" } },
          ...(Number.isInteger(Number(key)) ? [{ id: Number(key) }] : []),
        ],
      },
      include: {
        corretor: { select: { id: true, nome: true, telefone: true, creci: true, fotoUrl: true } },
        fotos: {
          orderBy: [{ principal: "desc" }, { ordem: "asc" }],
          select: { id: true, principal: true, ordem: true },
        },
      },
    });
    if (!imovel) return res.status(404).json({ erro: "Imóvel não encontrado" });

    const semelhantes = await prisma.imovel.findMany({
      where: {
        ...baseWhere(empresaId),
        id: { not: imovel.id },
        OR: [
          { bairro: imovel.bairro },
          { tipo: imovel.tipo },
          { finalidade: imovel.finalidade },
        ],
      },
      include: {
        fotos: {
          take: 1,
          orderBy: [{ principal: "desc" }, { ordem: "asc" }],
          select: { id: true, principal: true, ordem: true },
        },
      },
      take: 4,
      orderBy: { updatedAt: "desc" },
    });

    return res.json({
      ...sanitizeImovel(imovel, { detail: true }),
      semelhantes: semelhantes.map((item) => sanitizeImovel(item)),
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao buscar imóvel");
  }
}

export async function obterFotoPublica(req, res, next) {
  try {
    const empresaId = await requireEmpresaSiteAtivo(res);
    if (!empresaId) return undefined;

    const imovelId = Number(req.params.id);
    const fotoId = Number(req.params.fotoId);
    if (!Number.isInteger(imovelId) || !Number.isInteger(fotoId)) {
      return res.status(400).json({ erro: "Identificadores inválidos" });
    }

    const foto = await prisma.imovelFoto.findFirst({
      where: {
        id: fotoId,
        imovelId,
        empresaId,
        imovel: baseWhere(empresaId),
      },
      select: { nomeArquivo: true, mimeType: true, imovelId: true },
    });
    if (!foto || foto.nomeArquivo.startsWith("legacy-")) {
      return res.status(404).json({ erro: "Arquivo não encontrado" });
    }

    res.type(foto.mimeType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.sendFile(
      propertyImagePath(empresaId, foto.imovelId, foto.nomeArquivo),
      (error) => {
        if (error && !res.headersSent) next(error);
      },
    );
  } catch (error) {
    return next(error);
  }
}

export async function listarCorretoresPublicos(req, res) {
  try {
    const empresaId = await requireEmpresaSiteAtivo(res);
    if (!empresaId) return undefined;

    const flags = await prisma.empresa.findFirst({
      where: { id: empresaId },
      select: { siteExibirCorretores: true },
    });
    if (flags?.siteExibirCorretores === false) {
      return res.json({ data: [] });
    }

    const corretores = await prisma.usuario.findMany({
      where: {
        empresaId,
        ativo: true,
        statusCorretor: { in: ["ATIVO", "FERIAS"] },
        tipo: { in: ["ADMIN", "GERENTE", "CORRETOR"] },
      },
      select: {
        id: true,
        nome: true,
        telefone: true,
        creci: true,
        fotoUrl: true,
        tipo: true,
        metaMensal: true,
      },
      orderBy: { nome: "asc" },
      take: 50,
    });

    return res.json({
      data: corretores.map((item) => ({
        id: item.id,
        nome: item.nome,
        telefone: item.telefone,
        creci: item.creci,
        fotoUrl: item.fotoUrl,
        especialidade: item.tipo === "GERENTE" ? "Gestão comercial" : "Corretagem",
      })),
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao listar corretores");
  }
}

export async function dadosEmpresaPublica(req, res) {
  try {
    const empresaId = await requireEmpresaSiteAtivo(res);
    if (!empresaId) return undefined;
    const empresa = await prisma.empresa.findFirst({
      where: { id: empresaId, ativo: true },
    });
    if (!empresa) return res.status(404).json({ erro: "Empresa não encontrada" });
    if (empresa.siteAtivo === false) {
      return res.status(503).json({ erro: "Site temporariamente indisponível para esta empresa" });
    }
    const publicData = sanitizeEmpresa(empresa);
    return res.json({
      ...publicData,
      logoUrl: empresa.logoArquivo || empresa.logoUrl ? "/public/empresa/logo" : null,
      faviconUrl: empresa.faviconArquivo || empresa.faviconUrl ? "/public/empresa/favicon" : null,
      // não expor arquivos internos
      plano: undefined,
      ativo: undefined,
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao carregar empresa");
  }
}

export async function obterAssetEmpresaPublico(req, res, next) {
  try {
    const empresaId = await requireEmpresaSiteAtivo(res);
    if (!empresaId) return undefined;
    const kind = req.params.kind === "favicon" ? "favicon" : "logo";
    const empresa = await prisma.empresa.findFirst({
      where: { id: empresaId, ativo: true, siteAtivo: true },
      select: { logoArquivo: true, faviconArquivo: true, logoUrl: true, faviconUrl: true },
    });
    if (!empresa) return res.status(404).json({ erro: "Empresa não encontrada" });

    const filename = kind === "favicon" ? empresa.faviconArquivo : empresa.logoArquivo;
    if (filename) {
      const filePath = path.join(EMPRESA_UPLOAD_ROOT, String(empresaId), filename);
      if (!fs.existsSync(filePath)) return res.status(404).json({ erro: "Arquivo não encontrado" });
      res.setHeader("Cache-Control", "public, max-age=3600");
      return res.sendFile(filePath);
    }

    const external = kind === "favicon" ? empresa.faviconUrl : empresa.logoUrl;
    if (external && /^https?:\/\//i.test(external)) {
      return res.redirect(302, external);
    }
    return res.status(404).json({ erro: "Arquivo não encontrado" });
  } catch (error) {
    return next(error);
  }
}

async function resolveSiteActor(empresaId, preferCorretorId) {
  if (preferCorretorId) {
    const preferred = await prisma.usuario.findFirst({
      where: { id: preferCorretorId, empresaId, ativo: true },
      select: { id: true },
    });
    if (preferred) return preferred.id;
  }
  const admin = await prisma.usuario.findFirst({
    where: { empresaId, ativo: true, tipo: { in: ["ADMIN", "GERENTE"] } },
    orderBy: { id: "asc" },
    select: { id: true },
  });
  return admin?.id || null;
}

export async function criarLeadPublico(req, res) {
  try {
    const empresaId = await requireEmpresaSiteAtivo(res);
    if (!empresaId) return undefined;

    const nome = String(req.body?.nome || "").trim();
    const telefone = String(req.body?.telefone || req.body?.whatsapp || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase() || null;
    const mensagem = String(req.body?.mensagem || "").trim();
    const origem = String(req.body?.origem || "SITE").trim().slice(0, 80) || "SITE";
    const tipoFormulario = String(req.body?.tipoFormulario || "INTERESSE").trim().toUpperCase();
    const imovelId = parsePositiveInteger(req.body?.imovelId, undefined);
    const agendarVisita = req.body?.agendarVisita === true || req.body?.agendarVisita === "true";
    const dataVisita = req.body?.dataVisita ? new Date(req.body.dataVisita) : null;

    if (!nome || nome.length < 2) return res.status(400).json({ erro: "Informe o nome" });
    if (!telefone || telefone.length < 8) return res.status(400).json({ erro: "Informe um telefone válido" });
    if (mensagem && mensagem.length > 4000) return res.status(400).json({ erro: "Mensagem muito longa" });
    // Data da visita é opcional: sem data, cria lead VISITA aguardando contato
    if (agendarVisita && dataVisita && Number.isNaN(dataVisita.getTime())) {
      return res.status(400).json({ erro: "Data da visita inválida" });
    }

    let imovel = null;
    if (imovelId) {
      imovel = await prisma.imovel.findFirst({
        where: { id: imovelId, ...baseWhere(empresaId) },
        select: { id: true, titulo: true, codigo: true, corretorId: true, endereco: true, bairro: true },
      });
      if (!imovel) return res.status(400).json({ erro: "Imóvel inválido ou não publicado" });
    }

    const actorId = await resolveSiteActor(empresaId, imovel?.corretorId);
    if (!actorId) return res.status(503).json({ erro: "Nenhum corretor disponível para receber o lead" });

    // ensure pipeline etapas (inline minimal)
    const etapaCount = await prisma.pipelineEtapa.count({ where: { empresaId } });
    if (etapaCount === 0) {
      await prisma.pipelineEtapa.createMany({
        data: [
          { empresaId, nome: "Leads", codigo: "LEAD", ordem: 1, cor: "#64748b", tipo: "ABERTA", probabilidadePadrao: 10 },
          { empresaId, nome: "Oportunidades", codigo: "OPORTUNIDADE", ordem: 2, cor: "#2563eb", tipo: "ABERTA", probabilidadePadrao: 25 },
        ],
      });
    }
    const etapa = await prisma.pipelineEtapa.findFirst({
      where: { empresaId, ativo: true, tipo: "ABERTA" },
      orderBy: { ordem: "asc" },
    });

    const result = await prisma.$transaction(async (tx) => {
      let cliente = null;
      if (email) {
        cliente = await tx.cliente.findFirst({
          where: { empresaId, email, ativo: true },
        });
      }
      if (!cliente && telefone) {
        cliente = await tx.cliente.findFirst({
          where: {
            empresaId,
            ativo: true,
            OR: [{ telefone }, { whatsapp: telefone }],
          },
        });
      }
      if (!cliente) {
        cliente = await tx.cliente.create({
          data: {
            empresaId,
            corretorId: actorId,
            tipo: tipoFormulario === "AVALIACAO" ? "PROPRIETARIO" : "LEAD",
            status: "PROSPECTO",
            nome,
            email,
            telefone,
            whatsapp: telefone,
            origem,
            ativo: true,
          },
        });
      } else {
        cliente = await tx.cliente.update({
          where: { id: cliente.id },
          data: {
            telefone: cliente.telefone || telefone,
            whatsapp: cliente.whatsapp || telefone,
            email: cliente.email || email,
            origem: cliente.origem || origem,
          },
        });
      }

      const titulo = imovel
        ? `${nome} — interesse em ${imovel.codigo}`
        : tipoFormulario === "AVALIACAO"
          ? `${nome} — avaliação de imóvel (site)`
          : `${nome} — contato pelo site`;

      const lead = await tx.lead.create({
        data: {
          empresaId,
          clienteId: cliente.id,
          imovelId: imovel?.id || null,
          corretorId: actorId,
          etapaId: etapa?.id || null,
          titulo,
          status: "NOVO",
          probabilidade: etapa?.probabilidadePadrao ?? 10,
          origem,
          notas: [
            mensagem || null,
            `Formulário: ${tipoFormulario}`,
            req.body?.utm_source ? `utm_source=${req.body.utm_source}` : null,
            req.body?.utm_campaign ? `utm_campaign=${req.body.utm_campaign}` : null,
          ].filter(Boolean).join("\n") || null,
          ativo: true,
        },
      });

      await tx.leadHistorico.create({
        data: {
          empresaId,
          leadId: lead.id,
          usuarioId: actorId,
          acao: "CRIADO",
          alteracoes: { origem, tipoFormulario, canal: "SITE" },
        },
      });

      if (mensagem) {
        await tx.leadComentario.create({
          data: {
            empresaId,
            leadId: lead.id,
            usuarioId: actorId,
            conteudo: mensagem,
          },
        });
      }

      let evento = null;
      if (agendarVisita && dataVisita) {
        const fim = new Date(dataVisita.getTime() + 60 * 60 * 1000);
        evento = await tx.eventoAgenda.create({
          data: {
            empresaId,
            usuarioId: actorId,
            criadoPorId: actorId,
            clienteId: cliente.id,
            imovelId: imovel?.id || null,
            leadId: lead.id,
            titulo: imovel ? `Visita — ${imovel.codigo}` : `Visita — ${nome}`,
            tipo: "VISITA",
            status: "AGENDADO",
            dataInicio: dataVisita,
            dataFim: fim,
            localizacao: imovel ? `${imovel.endereco || ""} — ${imovel.bairro || ""}`.trim() : null,
            ativo: true,
          },
        });
        await tx.leadHistorico.create({
          data: {
            empresaId,
            leadId: lead.id,
            usuarioId: actorId,
            acao: "AGENDA_VINCULADA",
            alteracoes: { eventoId: evento.id, dataInicio: dataVisita.toISOString() },
          },
        });
      }

      return { lead, cliente, evento };
    });

    return res.status(201).json({
      mensagem: "Recebemos seu contato. Em breve um especialista retornará.",
      protocolo: `TC-${result.lead.id}`,
      leadId: result.lead.id,
      agendaId: result.evento?.id || null,
    });
  } catch (error) {
    return sendControllerError(res, error, "Erro ao registrar interesse");
  }
}
