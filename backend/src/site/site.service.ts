import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  FinalidadeImovel,
  Prisma,
  Property,
  PropertyImage,
  TipoImovel,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { buildPropertySlug, buildPublicFileUrl } from '../common/utils/slug';
import { SitePropertiesQueryDto } from './dto/site-properties-query.dto';

type PropertyWithImages = Property & { images: PropertyImage[] };

type SitePropertyCard = {
  codigo: string;
  titulo: string;
  tipo: TipoImovel;
  finalidade: FinalidadeImovel;
  valorVenda: number | null;
  valorLocacao: number | null;
  cidade: string;
  bairro: string;
  quartos: number;
  banheiros: number;
  vagas: number;
  areaConstruida: number | null;
  imagemCapa: string | null;
  slug: string;
};

@Injectable()
export class SiteService {
  constructor(private readonly prisma: PrismaService) {}

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

    const [destaques, ultimos, cidadesGrouped, tiposGrouped] = await Promise.all([
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
    if (
      query.minValor != null
      && query.maxValor != null
      && query.maxValor < query.minValor
    ) {
      throw new BadRequestException('maxValor deve ser maior ou igual a minValor');
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

    if (query.tipo) and.push({ tipo: query.tipo });
    if (query.finalidade) and.push({ finalidade: query.finalidade });
    if (query.quartos != null) and.push({ quartos: { gte: query.quartos } });

    if (query.minValor != null || query.maxValor != null) {
      const priceFilter: Prisma.FloatNullableFilter = {};
      if (query.minValor != null) priceFilter.gte = query.minValor;
      if (query.maxValor != null) priceFilter.lte = query.maxValor;

      and.push({
        OR: [
          { valorVenda: priceFilter },
          { valorLocacao: priceFilter },
        ],
      });
    }

    return { AND: and };
  }

  private toCard(property: PropertyWithImages | (Property & { images?: PropertyImage[] })): SitePropertyCard {
    const cover = property.images?.find((image) => image.isCover) || property.images?.[0];

    return {
      codigo: property.codigo,
      titulo: property.titulo,
      tipo: property.tipo,
      finalidade: property.finalidade,
      valorVenda: property.valorVenda,
      valorLocacao: property.valorLocacao,
      cidade: property.cidade,
      bairro: property.bairro,
      quartos: property.quartos,
      banheiros: property.banheiros,
      vagas: property.vagas,
      areaConstruida: property.areaConstruida,
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
}
