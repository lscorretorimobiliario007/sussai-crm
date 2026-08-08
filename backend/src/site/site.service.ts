import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  FinalidadeImovel,
  LeadOrigem,
  LeadStatus,
  Prisma,
  Property,
  PropertyImage,
  StatusEventoAgenda,
  SystemLogLevel,
  TipoEventoAgenda,
  TipoImovel,
  UserProfile,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PipelineService } from '../pipeline/pipeline.service';
import { buildPropertySlug, buildPublicFileUrl } from '../common/utils/slug';
import { SitePropertiesQueryDto } from './dto/site-properties-query.dto';
import {
  CreatePublicLeadDto,
  TipoFormularioSite,
} from './dto/create-public-lead.dto';

type PropertyWithImages = Property & { images: PropertyImage[] };

type SitePropertyCard = {
  id: number;
  codigo: string;
  titulo: string;
  tipo: TipoImovel;
  finalidade: FinalidadeImovel;
  valorVenda: number | null;
  valorLocacao: number | null;
  cidade: string;
  bairro: string;
  estado: string;
  quartos: number;
  suites: number;
  banheiros: number;
  vagas: number;
  areaConstruida: number | null;
  areaTerreno: number | null;
  destaque: boolean;
  publicado: boolean;
  imagemCapa: string | null;
  slug: string;
};

const ALTO_PADRAO_MIN_VALOR = 1_500_000;
const LANCAMENTO_DIAS = 180;
const VISITA_DURACAO_MS = 60 * 60 * 1000;

@Injectable()
export class SiteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pipelineService: PipelineService,
  ) {}

  async listProperties(query: SitePropertiesQueryDto) {
    const empresaId = this.resolveEmpresaId();
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const where = this.buildWhere(empresaId, query);

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.property.findMany({
        where,
        include: {
          images: {
            orderBy: [{ isCover: 'desc' }, { order: 'asc' }, { id: 'asc' }],
            take: 1,
          },
        },
        orderBy: [{ destaque: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.property.count({ where }),
    ]);

    return {
      data: rows.map((item) => this.toCard(item)),
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async getPropertyByCodigo(codigo: string) {
    const empresaId = this.resolveEmpresaId();
    const key = String(codigo || '').trim();

    if (!key) {
      throw new BadRequestException('Código do imóvel inválido');
    }

    const property = await this.prisma.property.findFirst({
      where: {
        empresaId,
        ativo: true,
        publicado: true,
        OR: [
          { codigo: { equals: key, mode: 'insensitive' } },
          { slug: { equals: key, mode: 'insensitive' } },
        ],
      },
      include: {
        images: {
          orderBy: [{ isCover: 'desc' }, { order: 'asc' }, { id: 'asc' }],
        },
      },
    });

    if (!property) {
      throw new NotFoundException('Imóvel não encontrado');
    }

    const semelhantes = await this.prisma.property.findMany({
      where: {
        empresaId,
        ativo: true,
        publicado: true,
        cidade: { equals: property.cidade, mode: 'insensitive' },
        tipo: property.tipo,
        NOT: { id: property.id },
      },
      include: {
        images: {
          orderBy: [{ isCover: 'desc' }, { order: 'asc' }, { id: 'asc' }],
          take: 1,
        },
      },
      orderBy: [{ destaque: 'desc' }, { createdAt: 'desc' }],
      take: 6,
    });

    return {
      ...this.toDetail(property),
      imagens: property.images.map((image) => ({
        id: image.id,
        url: buildPublicFileUrl(image.filePath),
        isCover: image.isCover,
        order: image.order,
      })),
      semelhantes: semelhantes.map((item) => this.toCard(item)),
    };
  }

  async getHome() {
    const empresaId = this.resolveEmpresaId();
    const baseWhere: Prisma.PropertyWhereInput = {
      empresaId,
      ativo: true,
      publicado: true,
    };

    const [destaques, ultimos, cidadesGrouped, tiposGrouped] =
      await Promise.all([
        this.prisma.property.findMany({
          where: { ...baseWhere, destaque: true },
          include: {
            images: {
              orderBy: [{ isCover: 'desc' }, { order: 'asc' }, { id: 'asc' }],
              take: 1,
            },
          },
          orderBy: [{ createdAt: 'desc' }],
          take: 8,
        }),
        this.prisma.property.findMany({
          where: baseWhere,
          include: {
            images: {
              orderBy: [{ isCover: 'desc' }, { order: 'asc' }, { id: 'asc' }],
              take: 1,
            },
          },
          orderBy: [{ createdAt: 'desc' }],
          take: 12,
        }),
        this.prisma.property.groupBy({
          by: ['cidade'],
          where: baseWhere,
          _count: { _all: true },
          orderBy: { cidade: 'asc' },
        }),
        this.prisma.property.groupBy({
          by: ['tipo'],
          where: baseWhere,
          _count: { _all: true },
          orderBy: { tipo: 'asc' },
        }),
      ]);

    return {
      destaques: destaques.map((item) => this.toCard(item)),
      ultimos: ultimos.map((item) => this.toCard(item)),
      cidades: cidadesGrouped.map((item) => ({
        cidade: item.cidade,
        total: item._count._all,
      })),
      tipos: tiposGrouped.map((item) => ({
        tipo: item.tipo,
        total: item._count._all,
      })),
    };
  }

  async getPublicEmpresa() {
    const empresaId = this.resolveEmpresaId();
    const empresa = await this.prisma.empresa.findFirst({
      where: { id: empresaId, ativo: true },
    });

    if (!empresa) {
      throw new NotFoundException('Empresa não encontrada');
    }

    return {
      id: empresa.id,
      nome: empresa.nome,
      nomeFantasia: empresa.nomeFantasia,
      creci: empresa.creci ?? null,
      email: empresa.email,
      telefone: empresa.telefone,
      whatsapp: empresa.whatsapp,
      siteUrl: empresa.siteUrl,
      slogan: empresa.slogan ?? null,
      logoUrl: empresa.logoUrl ? this.toAbsoluteMedia(empresa.logoUrl) : null,
      faviconUrl: empresa.faviconUrl
        ? this.toAbsoluteMedia(empresa.faviconUrl)
        : null,
      corPrimaria: empresa.corPrimaria || '#0B1F3A',
      corSecundaria: empresa.corSecundaria || '#C9A227',
      endereco: empresa.endereco,
      numero: empresa.numero ?? null,
      complemento: empresa.complemento ?? null,
      bairro: empresa.bairro ?? null,
      cidade: empresa.cidade,
      estado: empresa.estado,
      cep: empresa.cep,
      instagram: empresa.instagram ?? null,
      facebook: empresa.facebook ?? null,
      linkedin: empresa.linkedin ?? null,
      youtube: empresa.youtube ?? null,
      horarioAtendimento: empresa.horarioAtendimento ?? null,
      googleMapsUrl: empresa.googleMapsUrl ?? null,
      latitude: empresa.latitude ?? null,
      longitude: empresa.longitude ?? null,
      siteTitulo: empresa.siteTitulo ?? null,
      siteDescricao: empresa.siteDescricao ?? null,
      seoKeywords: empresa.seoKeywords ?? null,
      siteAtivo: empresa.siteAtivo !== false,
      siteExibirCorretores: empresa.siteExibirCorretores !== false,
      siteExibirBlog: empresa.siteExibirBlog !== false,
    };
  }

  async listPublicCorretores() {
    const empresaId = this.resolveEmpresaId();
    const empresa = await this.prisma.empresa.findFirst({
      where: { id: empresaId, ativo: true },
      select: { siteExibirCorretores: true },
    });

    if (!empresa || empresa.siteExibirCorretores === false) {
      return { data: [] };
    }

    const corretores = await this.prisma.usuario.findMany({
      where: {
        empresaId,
        ativo: true,
        perfil: UserProfile.CORRETOR,
      },
      select: {
        id: true,
        nome: true,
        creci: true,
        telefone: true,
        fotoUrl: true,
      },
      orderBy: { nome: 'asc' },
    });

    return {
      data: corretores.map((item) => ({
        id: item.id,
        nome: item.nome,
        creci: item.creci ?? null,
        telefone: item.telefone ?? null,
        fotoUrl: item.fotoUrl ? this.toAbsoluteMedia(item.fotoUrl) : null,
        foto: item.fotoUrl ? this.toAbsoluteMedia(item.fotoUrl) : null,
      })),
    };
  }

  async createPublicLead(dto: CreatePublicLeadDto) {
    const lgpdOk = dto.lgpdAceite ?? dto.aceiteLgpd;
    if (lgpdOk === false) {
      throw new BadRequestException(
        'É necessário aceitar a política de privacidade (LGPD)',
      );
    }

    const empresaId = this.resolveEmpresaId();
    const propertyId = dto.propertyId ?? dto.imovelId ?? null;

    if (propertyId != null) {
      const property = await this.prisma.property.findFirst({
        where: { id: propertyId, empresaId, ativo: true },
        select: { id: true },
      });
      if (!property) {
        throw new BadRequestException('Imóvel inválido para esta empresa');
      }
    }

    const telefone = dto.telefone.trim();
    const whatsapp = dto.whatsapp?.trim() || telefone || null;
    const tipoFormulario = dto.tipoFormulario ?? TipoFormularioSite.CONTATO;
    const origem = dto.origem ?? LeadOrigem.SITE;
    const descricaoImovel =
      this.normalizeOptionalText(dto.descricaoImovel) ??
      this.normalizeOptionalText(dto.descricao);

    const defaultStage = await this.pipelineService.getDefaultStage(empresaId);
    const observacoes = this.buildPublicLeadObservacoes(
      {
        ...dto,
        descricaoImovel: descricaoImovel ?? undefined,
        lgpdAceite: lgpdOk,
      },
      {
        propertyId,
        tipoFormulario,
        origem,
      },
    );

    const mensagemBase =
      this.normalizeOptionalText(dto.mensagem) ??
      (tipoFormulario === TipoFormularioSite.ANUNCIO ||
      tipoFormulario === TipoFormularioSite.CAPTACAO
        ? descricaoImovel
        : null);

    const isVisitaSemData =
      tipoFormulario === TipoFormularioSite.VISITA &&
      !(dto.agendarVisita && dto.dataVisita);

    const observacoesFinais = isVisitaSemData
      ? `${observacoes}\nStatus inicial: Aguardando contato (sem data preferencial — corretor agenda no CRM).`.trim()
      : observacoes;

    const lead = await this.prisma.lead.create({
      data: {
        empresaId,
        propertyId,
        assignedUserId: null,
        stageId: defaultStage.id,
        nome: dto.nome.trim(),
        email: this.normalizeOptionalText(dto.email)?.toLowerCase() ?? null,
        telefone,
        whatsapp,
        origem,
        status: LeadStatus.NOVO,
        mensagem: mensagemBase,
        observacoes: observacoesFinais,
        ativo: true,
      },
    });

    let agendaId: number | null = null;

    if (dto.agendarVisita && dto.dataVisita) {
      const inicio = this.parseOptionalDate(dto.dataVisita, 'dataVisita');
      if (inicio) {
        const admin = await this.prisma.usuario.findFirst({
          where: {
            empresaId,
            ativo: true,
            perfil: UserProfile.ADMIN,
          },
          select: { id: true },
          orderBy: { id: 'asc' },
        });

        if (admin) {
          const fim = new Date(inicio.getTime() + VISITA_DURACAO_MS);
          const evento = await this.prisma.eventoAgenda.create({
            data: {
              empresaId,
              titulo: `Visita — ${dto.nome.trim()}`,
              tipo: TipoEventoAgenda.VISITA,
              status: StatusEventoAgenda.AGENDADO,
              inicio,
              fim,
              leadId: lead.id,
              propertyId,
              usuarioId: admin.id,
              createdById: admin.id,
              descricao: this.normalizeOptionalText(dto.mensagem),
              ativo: true,
            },
          });
          agendaId = evento.id;

          await this.prisma.lead.update({
            where: { id: lead.id },
            data: { status: LeadStatus.VISITA_AGENDADA },
          });
        }
      }
    }

    try {
      const admins = await this.prisma.usuario.findMany({
        where: {
          empresaId,
          ativo: true,
          perfil: UserProfile.ADMIN,
        },
        select: { id: true },
      });

      if (admins.length > 0) {
        await this.prisma.appNotification.createMany({
          data: admins.map((admin) => ({
            empresaId,
            userId: admin.id,
            title: 'Novo lead do site',
            body: `${dto.nome.trim()} — ${tipoFormulario}${propertyId ? ` (imóvel #${propertyId})` : ''}`,
            link: `/leads/${lead.id}`,
          })),
        });
      }
    } catch {
      // Notificação é opcional; não falhar o lead
    }

    try {
      await this.prisma.systemLog.create({
        data: {
          level: SystemLogLevel.INFO,
          message: `Lead público criado #${lead.id}`,
          context: {
            leadId: lead.id,
            empresaId,
            origem,
            tipoFormulario,
            propertyId,
            agendaId,
          },
        },
      });
    } catch {
      // Log é opcional
    }

    return {
      mensagem: 'Recebemos seu contato!',
      protocolo: `TC-${String(lead.id).padStart(6, '0')}`,
      leadId: lead.id,
      agendaId,
    };
  }

  private resolveEmpresaId(): number {
    const raw = process.env.SITE_EMPRESA_ID;
    const empresaId = Number(raw);

    if (!Number.isInteger(empresaId) || empresaId <= 0) {
      throw new ServiceUnavailableException(
        'SITE_EMPRESA_ID não configurado para o site público',
      );
    }

    return empresaId;
  }

  private buildWhere(
    empresaId: number,
    query: SitePropertiesQueryDto,
  ): Prisma.PropertyWhereInput {
    const minValor = query.minValor ?? query.valorMin;
    const maxValor = query.maxValor ?? query.valorMax;
    const quartos = query.quartos ?? query.quartosMin;
    const destaque = query.destaque === true || query.destaqueSite === true;

    if (minValor != null && maxValor != null && maxValor < minValor) {
      throw new BadRequestException(
        'maxValor deve ser maior ou igual a minValor',
      );
    }

    const and: Prisma.PropertyWhereInput[] = [
      {
        empresaId,
        ativo: true,
        publicado: true,
      },
    ];

    if (query.cidade?.trim()) {
      and.push({
        cidade: { contains: query.cidade.trim(), mode: 'insensitive' },
      });
    }

    if (query.bairro?.trim()) {
      and.push({
        bairro: { contains: query.bairro.trim(), mode: 'insensitive' },
      });
    }

    if (query.tipo) {
      const tipoMap: Record<string, TipoImovel> = {
        CASA: TipoImovel.CASA,
        APARTAMENTO: TipoImovel.APARTAMENTO,
        COBERTURA: TipoImovel.APARTAMENTO,
        KITNET: TipoImovel.APARTAMENTO,
        SOBRADO: TipoImovel.CASA,
        TERRENO: TipoImovel.TERRENO,
        COMERCIAL: TipoImovel.COMERCIAL,
        SALA_COMERCIAL: TipoImovel.COMERCIAL,
        GALPAO: TipoImovel.COMERCIAL,
      };
      const mapped = tipoMap[query.tipo.toUpperCase()];
      if (mapped) and.push({ tipo: mapped });
    }
    if (query.finalidade) and.push({ finalidade: query.finalidade });
    if (quartos != null) and.push({ quartos: { gte: quartos } });
    if (destaque) and.push({ destaque: true });

    if (minValor != null || maxValor != null) {
      const priceFilter: Prisma.FloatNullableFilter = {};
      if (minValor != null) priceFilter.gte = minValor;
      if (maxValor != null) priceFilter.lte = maxValor;

      and.push({
        OR: [{ valorVenda: priceFilter }, { valorLocacao: priceFilter }],
      });
    }

    if (query.busca?.trim()) {
      const term = query.busca.trim();
      and.push({
        OR: [
          { titulo: { contains: term, mode: 'insensitive' } },
          { cidade: { contains: term, mode: 'insensitive' } },
          { bairro: { contains: term, mode: 'insensitive' } },
          { codigo: { contains: term, mode: 'insensitive' } },
        ],
      });
    }

    if (query.comercial === true) {
      and.push({ tipo: TipoImovel.COMERCIAL });
    }

    if (query.secao?.trim()) {
      const secao = query.secao.trim().toLowerCase();
      if (secao === 'destaque' || secao === 'destaques') {
        and.push({ destaque: true });
      } else if (secao === 'lancamento' || secao === 'lancamentos') {
        const since = new Date();
        since.setDate(since.getDate() - LANCAMENTO_DIAS);
        and.push({
          OR: [{ createdAt: { gte: since } }, { destaque: true }],
        });
      } else if (secao === 'comercial') {
        and.push({ tipo: TipoImovel.COMERCIAL });
      } else if (secao === 'alto-padrao' || secao === 'altopadrao') {
        and.push({
          OR: [
            { valorVenda: { gte: ALTO_PADRAO_MIN_VALOR } },
            { destaque: true },
          ],
        });
      }
    }

    if (query.altoPadrao === true) {
      and.push({
        OR: [
          { valorVenda: { gte: ALTO_PADRAO_MIN_VALOR } },
          { destaque: true },
        ],
      });
    }

    if (query.lancamento === true) {
      const since = new Date();
      since.setDate(since.getDate() - LANCAMENTO_DIAS);
      and.push({
        OR: [{ createdAt: { gte: since } }, { destaque: true }],
      });
    }

    return { AND: and };
  }

  private buildPublicLeadObservacoes(
    dto: CreatePublicLeadDto,
    meta: {
      propertyId: number | null;
      tipoFormulario: TipoFormularioSite;
      origem: LeadOrigem;
    },
  ): string {
    const payload: Record<string, unknown> = {
      tipoFormulario: meta.tipoFormulario,
      origem: meta.origem,
      propertyId: meta.propertyId,
      paginaOrigem: dto.paginaOrigem ?? null,
      canal: dto.canal ?? null,
      utm: {
        source: dto.utmSource ?? null,
        medium: dto.utmMedium ?? null,
        campaign: dto.utmCampaign ?? null,
        term: dto.utmTerm ?? null,
        content: dto.utmContent ?? null,
      },
      agendarVisita: dto.agendarVisita ?? false,
      dataVisita: dto.dataVisita ?? null,
      lgpdAceite: dto.lgpdAceite ?? dto.aceiteLgpd ?? null,
      ip: dto.ip ?? null,
    };

    const captacao: Record<string, unknown> = {};
    if (dto.tipoImovel) captacao.tipoImovel = dto.tipoImovel;
    if (dto.finalidade) captacao.finalidade = dto.finalidade;
    if (dto.cidade) captacao.cidade = dto.cidade;
    if (dto.bairro) captacao.bairro = dto.bairro;
    if (dto.endereco) captacao.endereco = dto.endereco;
    if (dto.dormitorios != null) captacao.dormitorios = dto.dormitorios;
    if (dto.suites != null) captacao.suites = dto.suites;
    if (dto.banheiros != null) captacao.banheiros = dto.banheiros;
    if (dto.vagas != null) captacao.vagas = dto.vagas;
    if (dto.area != null) captacao.area = dto.area;
    if (dto.valorDesejado != null) captacao.valorDesejado = dto.valorDesejado;
    if (dto.descricaoImovel) captacao.descricaoImovel = dto.descricaoImovel;
    if (dto.descricao && !dto.descricaoImovel) {
      captacao.descricaoImovel = dto.descricao;
    }
    if (dto.fotosCount != null) captacao.fotosCount = dto.fotosCount;
    if (dto.fotosNomes) captacao.fotosNomes = dto.fotosNomes;

    if (Object.keys(captacao).length > 0) {
      payload.captacao = captacao;
    }

    return JSON.stringify(payload, null, 2);
  }

  private toCard(
    property: PropertyWithImages | (Property & { images?: PropertyImage[] }),
  ): SitePropertyCard {
    const cover =
      property.images?.find((image) => image.isCover) || property.images?.[0];

    return {
      id: property.id,
      codigo: property.codigo,
      titulo: property.titulo,
      tipo: property.tipo,
      finalidade: property.finalidade,
      valorVenda: property.valorVenda,
      valorLocacao: property.valorLocacao,
      cidade: property.cidade,
      bairro: property.bairro,
      estado: property.estado,
      quartos: property.quartos,
      suites: property.suites,
      banheiros: property.banheiros,
      vagas: property.vagas,
      areaConstruida: property.areaConstruida,
      areaTerreno: property.areaTerreno,
      destaque: property.destaque,
      publicado: property.publicado,
      imagemCapa: cover ? buildPublicFileUrl(cover.filePath) : null,
      slug: property.slug || buildPropertySlug(property),
    };
  }

  private toDetail(property: PropertyWithImages) {
    return {
      id: property.id,
      codigo: property.codigo,
      slug: property.slug || buildPropertySlug(property),
      titulo: property.titulo,
      descricao: property.descricao,
      tipo: property.tipo,
      finalidade: property.finalidade,
      valorVenda: property.valorVenda,
      valorLocacao: property.valorLocacao,
      endereco: property.endereco,
      numero: property.numero,
      bairro: property.bairro,
      cidade: property.cidade,
      estado: property.estado,
      cep: property.cep,
      quartos: property.quartos,
      banheiros: property.banheiros,
      suites: property.suites,
      vagas: property.vagas,
      areaTerreno: property.areaTerreno,
      areaConstruida: property.areaConstruida,
      destaque: property.destaque,
      publicado: property.publicado,
      imagemCapa: this.toCard(property).imagemCapa,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
    };
  }

  private toAbsoluteMedia(path: string): string {
    if (/^https?:\/\//i.test(path)) return path;
    const cleaned = path.replace(/\\/g, '/');
    if (cleaned.startsWith('/uploads/')) {
      const base = (process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '');
      return base ? `${base}${cleaned}` : cleaned;
    }
    return buildPublicFileUrl(
      cleaned.replace(/^\/+/, '').replace(/^uploads\//, ''),
    );
  }

  private normalizeOptionalText(value?: string | null): string | null {
    if (value == null) return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }

  private parseOptionalDate(
    value?: string | null,
    field = 'data',
  ): Date | null {
    if (value == null || value === '') return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${field} inválida`);
    }
    return date;
  }
}
