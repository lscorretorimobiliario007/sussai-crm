import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  StatusContrato,
  TipoContrato,
  UserProfile,
  type Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CreateContratoDto } from './dto/create-contrato.dto';
import { QueryContratoDto } from './dto/query-contrato.dto';

const contratoInclude = {
  property: {
    select: { id: true, titulo: true, codigo: true, empresaId: true },
  },
  cliente: {
    select: { id: true, nome: true, empresaId: true },
  },
  corretor: {
    select: { id: true, nome: true, empresaId: true },
  },
} satisfies Prisma.ContratoInclude;

type ContratoRow = Prisma.ContratoGetPayload<{
  include: typeof contratoInclude;
}>;

function contratoNumero(id: number): string {
  return `CT-${String(id).padStart(6, '0')}`;
}

function mapContrato(contrato: ContratoRow, empresaId: number) {
  const { property, ...rest } = contrato;
  return {
    ...rest,
    numero: contratoNumero(contrato.id),
    propertyId: contrato.propertyId,
    imovelId: contrato.propertyId,
    imovel:
      property?.empresaId === empresaId
        ? {
            id: property.id,
            titulo: property.titulo,
            codigo: property.codigo,
          }
        : null,
    cliente:
      contrato.cliente?.empresaId === empresaId
        ? { id: contrato.cliente.id, nome: contrato.cliente.nome }
        : null,
    corretor:
      contrato.corretor?.empresaId === empresaId
        ? { id: contrato.corretor.id, nome: contrato.corretor.nome }
        : null,
  };
}

@Injectable()
export class ContratosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, dto: CreateContratoDto) {
    const propertyId = dto.propertyId ?? dto.imovelId;
    if (!propertyId) {
      throw new BadRequestException(
        'Imóvel, cliente, tipo, valor e data inicial são obrigatórios',
      );
    }

    const status =
      user.perfil === UserProfile.CORRETOR
        ? StatusContrato.RASCUNHO
        : (dto.status ?? StatusContrato.RASCUNHO);

    const corretorId =
      user.perfil === UserProfile.CORRETOR
        ? user.id
        : (dto.corretorId ?? user.id);

    await this.validateRelations(user.empresaId, {
      propertyId,
      clienteId: dto.clienteId,
      corretorId,
    });

    const dataInicio = this.parseDate(dto.dataInicio, 'Data inicial inválida');
    const dataFim = dto.dataFim
      ? this.parseDate(dto.dataFim, 'Data final inválida')
      : null;

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        if (
          status === StatusContrato.ATIVO &&
          (dto.tipo === TipoContrato.VENDA || dto.tipo === TipoContrato.ALUGUEL)
        ) {
          const conflito = await tx.contrato.findFirst({
            where: {
              empresaId: user.empresaId,
              propertyId,
              ativo: true,
              status: StatusContrato.ATIVO,
              tipo: { in: [TipoContrato.VENDA, TipoContrato.ALUGUEL] },
            },
            select: { id: true },
          });
          if (conflito) {
            throw new ConflictException('Imóvel já possui contrato ativo');
          }
        }

        return tx.contrato.create({
          data: {
            empresaId: user.empresaId,
            tipo: dto.tipo,
            status,
            valor: dto.valor,
            dataInicio,
            dataFim,
            clienteId: dto.clienteId,
            propertyId,
            corretorId,
            observacoes: this.normalizeOptionalText(dto.observacoes),
            ativo: true,
          },
          include: contratoInclude,
        });
      });

      return mapContrato(created, user.empresaId);
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      throw error;
    }
  }

  async findAll(user: AuthUser, query: QueryContratoDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const where: Prisma.ContratoWhereInput = {
      empresaId: user.empresaId,
      ativo: true,
      ...(query.status ? { status: query.status } : {}),
      ...(query.tipo ? { tipo: query.tipo } : {}),
      ...(user.perfil === UserProfile.CORRETOR ? { corretorId: user.id } : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.contrato.count({ where }),
      this.prisma.contrato.findMany({
        where,
        include: contratoInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: rows.map((row) => mapContrato(row, user.empresaId)),
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async findOne(user: AuthUser, id: number) {
    const where: Prisma.ContratoWhereInput = {
      id,
      empresaId: user.empresaId,
      ativo: true,
      ...(user.perfil === UserProfile.CORRETOR ? { corretorId: user.id } : {}),
    };

    const contrato = await this.prisma.contrato.findFirst({
      where,
      include: {
        ...contratoInclude,
        cobrancas: {
          where: { empresaId: user.empresaId },
          orderBy: { vencimento: 'asc' },
        },
      },
    });

    if (!contrato) {
      throw new NotFoundException('Contrato não encontrado');
    }

    return {
      ...mapContrato(contrato, user.empresaId),
      cobrancas: contrato.cobrancas,
    };
  }

  private async validateRelations(
    empresaId: number,
    ids: { propertyId: number; clienteId: number; corretorId?: number | null },
  ) {
    const property = await this.prisma.property.findFirst({
      where: { id: ids.propertyId, empresaId, ativo: true },
      select: { id: true },
    });
    if (!property) {
      throw new BadRequestException(
        'Relacionamento inválido para esta empresa',
      );
    }

    const cliente = await this.prisma.cliente.findFirst({
      where: { id: ids.clienteId, empresaId, ativo: true },
      select: { id: true },
    });
    if (!cliente) {
      throw new BadRequestException(
        'Relacionamento inválido para esta empresa',
      );
    }

    if (ids.corretorId != null) {
      const corretor = await this.prisma.usuario.findFirst({
        where: { id: ids.corretorId, empresaId, ativo: true },
        select: { id: true },
      });
      if (!corretor) {
        throw new BadRequestException(
          'Relacionamento inválido para esta empresa',
        );
      }
    }
  }

  private normalizeOptionalText(value?: string | null): string | null {
    if (value == null) return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }

  private parseDate(value: string, message: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(message);
    }
    return date;
  }
}
