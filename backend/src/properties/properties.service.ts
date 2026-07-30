import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FinalidadeImovel,
  Prisma,
  Property,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { QueryPropertyDto } from './dto/query-property.dto';
import { buildPropertySlug, slugify } from '../common/utils/slug';

type PropertyWithCover = Property & {
  images: {
    id: number;
    filePath: string;
    isCover: boolean;
  }[];
};

type PaginatedProperties = {
  data: PropertyWithCover[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    empresaId: number,
    dto: CreatePropertyDto,
  ): Promise<Property> {

    this.assertCommercialRules(dto);
    this.assertCep(dto.cep);

    const codigo = await this.generateCodigo(empresaId);

    const slug = await this.ensureUniqueSlug(
      empresaId,
      buildPropertySlug({
        titulo: dto.titulo,
        codigo,
      }),
    );

    try {

      return await this.prisma.property.create({

        data: {

          empresaId,

          codigo,

          slug,

          titulo: dto.titulo.trim(),

          descricao: dto.descricao?.trim() || null,

          finalidade: dto.finalidade,

          tipo: dto.tipo,

          valorVenda:
            dto.finalidade === FinalidadeImovel.VENDA
              ? dto.valorVenda ?? null
              : null,

          valorLocacao:
            dto.finalidade === FinalidadeImovel.LOCACAO
              ? dto.valorLocacao ?? null
              : null,

          endereco: dto.endereco.trim(),

          numero: dto.numero?.trim() || null,

          bairro: dto.bairro.trim(),

          cidade: dto.cidade.trim(),

          estado: dto.estado.trim().toUpperCase(),

          cep: this.normalizeCep(dto.cep),

          quartos: dto.quartos ?? 0,

          banheiros: dto.banheiros ?? 0,

          suites: dto.suites ?? 0,

          vagas: dto.vagas ?? 0,

          areaTerreno: dto.areaTerreno ?? null,

          areaConstruida: dto.areaConstruida ?? null,

          destaque: dto.destaque ?? false,

          publicado: dto.publicado ?? true,

          ativo: true,

        },

      });

    } catch (error) {

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Já existe um imóvel com este código nesta empresa',
        );
      }

      throw error;

    }
  }
    async findAll(
    empresaId: number,
    query: QueryPropertyDto,
  ): Promise<PaginatedProperties> {

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where = this.buildWhere(
      empresaId,
      query,
    );

    const [data, total] = await this.prisma.$transaction([

      this.prisma.property.findMany({

        where,

        include: {

          images: {

            where: {
              isCover: true,
            },

            orderBy: {
              order: 'asc',
            },

            take: 1,

          },

        },

        orderBy: [

          {
            destaque: 'desc',
          },

          {
            createdAt: 'desc',
          },

        ],

        skip: (page - 1) * limit,

        take: limit,

      }),

      this.prisma.property.count({

        where,

      }),

    ]);

    return {

      data,

      meta: {

        page,

        limit,

        total,

        totalPages: Math.ceil(total / limit),

      },

    };

  }
    async findOne(
    empresaId: number,
    id: number,
  ): Promise<PropertyWithCover> {

    const property = await this.prisma.property.findFirst({

      where: {

        id,

        empresaId,

        ativo: true,

      },

      include: {

        images: {

          orderBy: [

            {
              isCover: 'desc',
            },

            {
              order: 'asc',
            },

          ],

        },

      },

    });

    if (!property) {

      throw new NotFoundException(
        `Imóvel #${id} não encontrado`,
      );

    }

    return property;

  }
    async update(
    empresaId: number,
    id: number,
    dto: UpdatePropertyDto,
  ): Promise<Property> {

    const previous = await this.findOne(
      empresaId,
      id,
    );

    const merged = {

      finalidade: dto.finalidade ?? previous.finalidade,

      valorVenda:
        dto.valorVenda !== undefined
          ? dto.valorVenda
          : previous.valorVenda,

      valorLocacao:
        dto.valorLocacao !== undefined
          ? dto.valorLocacao
          : previous.valorLocacao,

      cep:
        dto.cep !== undefined
          ? dto.cep
          : previous.cep,

    };

    this.assertCommercialRules(merged);

    this.assertCep(merged.cep);

    const data: Prisma.PropertyUpdateInput = {};

    if (dto.titulo !== undefined)
      data.titulo = dto.titulo.trim();

    if (dto.descricao !== undefined)
      data.descricao = dto.descricao?.trim() || null;

    if (dto.finalidade !== undefined)
      data.finalidade = dto.finalidade;

    if (dto.tipo !== undefined)
      data.tipo = dto.tipo;

    if (dto.valorVenda !== undefined)
      data.valorVenda = dto.valorVenda;

    if (dto.valorLocacao !== undefined)
      data.valorLocacao = dto.valorLocacao;

    if (dto.endereco !== undefined)
      data.endereco = dto.endereco.trim();

    if (dto.numero !== undefined)
      data.numero = dto.numero?.trim() || null;

    if (dto.bairro !== undefined)
      data.bairro = dto.bairro.trim();

    if (dto.cidade !== undefined)
      data.cidade = dto.cidade.trim();

    if (dto.estado !== undefined)
      data.estado = dto.estado.trim().toUpperCase();

    if (dto.cep !== undefined)
      data.cep = this.normalizeCep(dto.cep);

    if (dto.quartos !== undefined)
      data.quartos = dto.quartos;

    if (dto.banheiros !== undefined)
      data.banheiros = dto.banheiros;

    if (dto.suites !== undefined)
      data.suites = dto.suites ?? 0;

    if (dto.vagas !== undefined)
      data.vagas = dto.vagas;

    if (dto.areaTerreno !== undefined)
      data.areaTerreno = dto.areaTerreno;

    if (dto.areaConstruida !== undefined)
      data.areaConstruida = dto.areaConstruida;

    if (dto.destaque !== undefined)
      data.destaque = dto.destaque;

    if (dto.publicado !== undefined)
      data.publicado = dto.publicado;

    if (merged.finalidade === FinalidadeImovel.VENDA) {

      data.valorVenda = merged.valorVenda;

      data.valorLocacao = null;

    } else {

      data.valorVenda = null;

      data.valorLocacao = merged.valorLocacao;

    }

    if (dto.titulo !== undefined || !previous.slug) {

      data.slug = await this.ensureUniqueSlug(

        empresaId,

        buildPropertySlug({

          titulo: dto.titulo ?? previous.titulo,

          codigo: previous.codigo,

          id: previous.id,

        }),

        previous.id,

      );

    }

    try {

      return await this.prisma.property.update({

        where: {
          id,
        },

        data,

      });

    } catch (error) {

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {

        throw new ConflictException(
          'Já existe um imóvel com este slug.',
        );

      }

      throw error;

    }

  }
    async remove(
    empresaId: number,
    id: number,
  ): Promise<{ mensagem: string; id: number }> {

    await this.findOne(
      empresaId,
      id,
    );

    await this.prisma.property.update({

      where: {
        id,
      },

      data: {

        ativo: false,

        publicado: false,

      },

    });

    return {

      mensagem: 'Imóvel desativado com sucesso',

      id,

    };

  }
    private buildWhere(
    empresaId: number,
    query: QueryPropertyDto,
  ): Prisma.PropertyWhereInput {

    const where: Prisma.PropertyWhereInput = {
      empresaId,
      ativo: true,
    };

    if (query.tipo) {
      where.tipo = query.tipo;
    }

    if (query.finalidade) {
      where.finalidade = query.finalidade;
    }

    if (query.publicado !== undefined) {
      where.publicado = query.publicado;
    }

    if (query.cidade?.trim()) {
      where.cidade = {
        contains: query.cidade.trim(),
        mode: 'insensitive',
      };
    }

    if (query.bairro?.trim()) {
      where.bairro = {
        contains: query.bairro.trim(),
        mode: 'insensitive',
      };
    }

    return where;
  }

  private assertCommercialRules(dto: {
    finalidade?: FinalidadeImovel;
    valorVenda?: number | null;
    valorLocacao?: number | null;
  }): void {

    if (!dto.finalidade) {
      throw new BadRequestException(
        'Informe a finalidade do imóvel',
      );
    }

    if (
      dto.finalidade === FinalidadeImovel.VENDA &&
      !(Number(dto.valorVenda) > 0)
    ) {
      throw new BadRequestException(
        'Informe o valor de venda',
      );
    }

    if (
      dto.finalidade === FinalidadeImovel.LOCACAO &&
      !(Number(dto.valorLocacao) > 0)
    ) {
      throw new BadRequestException(
        'Informe o valor de locação',
      );
    }
  }

  private assertCep(
    cep?: string | null,
  ): void {

    if (cep == null || cep === '') {
      return;
    }

    const digits = String(cep).replace(/\D/g, '');

    if (digits.length !== 8) {
      throw new BadRequestException(
        'CEP deve conter 8 dígitos',
      );
    }
  }

  private normalizeCep(
    cep?: string | null,
  ): string | null {

    if (!cep) {
      return null;
    }

    const digits = cep.replace(/\D/g, '');

    return digits || null;
  }

  private async generateCodigo(
    empresaId: number,
  ): Promise<string> {

    for (let tentativa = 0; tentativa < 5; tentativa++) {

      const total = await this.prisma.property.count({
        where: {
          empresaId,
        },
      });

      const codigo =
        `IMV-${String(total + tentativa + 1).padStart(4, '0')}`;

      const existe = await this.prisma.property.findFirst({

        where: {
          empresaId,
          codigo,
        },

        select: {
          id: true,
        },

      });

      if (!existe) {
        return codigo;
      }

    }

    return `IMV-${Date.now().toString().slice(-8)}`;
  }

  private async ensureUniqueSlug(
    empresaId: number,
    slug: string,
    excludeId?: number,
  ): Promise<string> {

    const base =
      slugify(slug) || `imovel-${Date.now()}`;

    let candidate = base;
    let tentativa = 1;

    while (tentativa < 50) {

      const existe =
        await this.prisma.property.findFirst({

          where: {

            empresaId,

            slug: candidate,

            ...(excludeId
              ? {
                  NOT: {
                    id: excludeId,
                  },
                }
              : {}),

          },

          select: {
            id: true,
          },

        });

      if (!existe) {
        return candidate;
      }

      tentativa++;

      candidate = `${base}-${tentativa}`;
    }

    return `${base}-${Date.now()}`;
  }

}