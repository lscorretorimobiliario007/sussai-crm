import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PrioridadeTarefa,
  StatusTarefa,
  UserProfile,
  type Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CreateTarefaDto } from './dto/create-tarefa.dto';
import { QueryTarefaDto } from './dto/query-tarefa.dto';
import { UpdateTarefaDto } from './dto/update-tarefa.dto';

const tarefaInclude = {
  responsavel: {
    select: { id: true, nome: true, empresaId: true },
  },
  lead: {
    select: { id: true, nome: true, empresaId: true },
  },
  cliente: {
    select: { id: true, nome: true, empresaId: true },
  },
  property: {
    select: { id: true, titulo: true, codigo: true, empresaId: true },
  },
} satisfies Prisma.TarefaInclude;

type TarefaRow = Prisma.TarefaGetPayload<{ include: typeof tarefaInclude }>;

function mapTarefa(tarefa: TarefaRow, empresaId: number) {
  const { responsavel, lead, cliente, property, ...rest } = tarefa;
  return {
    ...rest,
    dataLimite: tarefa.vencimento,
    usuarioId: tarefa.responsavelId,
    imovelId: tarefa.propertyId,
    usuario:
      responsavel?.empresaId === empresaId
        ? { id: responsavel.id, nome: responsavel.nome }
        : null,
    lead:
      lead?.empresaId === empresaId
        ? { id: lead.id, titulo: lead.nome, nome: lead.nome }
        : null,
    cliente:
      cliente?.empresaId === empresaId
        ? { id: cliente.id, nome: cliente.nome }
        : null,
    imovel:
      property?.empresaId === empresaId
        ? {
            id: property.id,
            titulo: property.titulo,
            codigo: property.codigo,
          }
        : null,
  };
}

@Injectable()
export class TarefasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, dto: CreateTarefaDto) {
    const responsavelId =
      user.perfil === UserProfile.CORRETOR
        ? user.id
        : (dto.responsavelId ?? dto.usuarioId ?? user.id);

    const propertyId = dto.propertyId ?? dto.imovelId ?? null;
    const vencimentoRaw = dto.vencimento ?? dto.dataLimite ?? null;

    await this.validateRelations(user.empresaId, {
      responsavelId,
      leadId: dto.leadId,
      clienteId: dto.clienteId,
      propertyId,
    });

    const created = await this.prisma.tarefa.create({
      data: {
        empresaId: user.empresaId,
        titulo: dto.titulo.trim(),
        descricao: this.normalizeOptionalText(dto.descricao),
        status: dto.status ?? StatusTarefa.PENDENTE,
        prioridade: dto.prioridade ?? PrioridadeTarefa.MEDIA,
        vencimento: this.parseOptionalDate(vencimentoRaw),
        responsavelId,
        leadId: dto.leadId ?? null,
        clienteId: dto.clienteId ?? null,
        propertyId,
        ativo: true,
      },
      include: tarefaInclude,
    });

    return mapTarefa(created, user.empresaId);
  }

  async findAll(user: AuthUser, query: QueryTarefaDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const where: Prisma.TarefaWhereInput = {
      empresaId: user.empresaId,
      ativo: true,
      ...(query.status ? { status: query.status } : {}),
      ...(query.prioridade ? { prioridade: query.prioridade } : {}),
      ...(user.perfil === UserProfile.CORRETOR
        ? { responsavelId: user.id }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.tarefa.count({ where }),
      this.prisma.tarefa.findMany({
        where,
        include: tarefaInclude,
        orderBy: [{ prioridade: 'desc' }, { vencimento: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: rows.map((row) => mapTarefa(row, user.empresaId)),
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async update(user: AuthUser, id: number, dto: UpdateTarefaDto) {
    await this.findOwnedOrFail(user, id);

    const responsavelId =
      user.perfil === UserProfile.CORRETOR
        ? user.id
        : dto.responsavelId !== undefined || dto.usuarioId !== undefined
          ? (dto.responsavelId ?? dto.usuarioId ?? null)
          : undefined;

    const propertyId =
      dto.propertyId !== undefined || dto.imovelId !== undefined
        ? (dto.propertyId ?? dto.imovelId ?? null)
        : undefined;

    await this.validateRelations(user.empresaId, {
      responsavelId: responsavelId === undefined ? undefined : responsavelId,
      leadId: dto.leadId,
      clienteId: dto.clienteId,
      propertyId: propertyId === undefined ? undefined : propertyId,
    });

    const data: Prisma.TarefaUpdateInput = {};
    if (dto.titulo !== undefined) data.titulo = dto.titulo.trim();
    if (dto.descricao !== undefined) {
      data.descricao = this.normalizeOptionalText(dto.descricao);
    }
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.prioridade !== undefined) data.prioridade = dto.prioridade;
    if (dto.vencimento !== undefined || dto.dataLimite !== undefined) {
      data.vencimento = this.parseOptionalDate(
        dto.vencimento ?? dto.dataLimite ?? null,
      );
    }
    if (responsavelId !== undefined) {
      data.responsavel = responsavelId
        ? { connect: { id: responsavelId } }
        : { disconnect: true };
    }
    if (dto.leadId !== undefined) {
      data.lead = dto.leadId
        ? { connect: { id: dto.leadId } }
        : { disconnect: true };
    }
    if (dto.clienteId !== undefined) {
      data.cliente = dto.clienteId
        ? { connect: { id: dto.clienteId } }
        : { disconnect: true };
    }
    if (propertyId !== undefined) {
      data.property = propertyId
        ? { connect: { id: propertyId } }
        : { disconnect: true };
    }

    const updated = await this.prisma.tarefa.update({
      where: { id },
      data,
      include: tarefaInclude,
    });

    return mapTarefa(updated, user.empresaId);
  }

  async remove(user: AuthUser, id: number) {
    await this.findOwnedOrFail(user, id);
    await this.prisma.tarefa.update({
      where: { id },
      data: { ativo: false },
    });
    return { mensagem: 'Tarefa removida', id };
  }

  private async findOwnedOrFail(user: AuthUser, id: number) {
    const tarefa = await this.prisma.tarefa.findFirst({
      where: {
        id,
        empresaId: user.empresaId,
        ativo: true,
        ...(user.perfil === UserProfile.CORRETOR
          ? { responsavelId: user.id }
          : {}),
      },
      select: { id: true },
    });
    if (!tarefa) {
      throw new NotFoundException('Tarefa não encontrada');
    }
    return tarefa;
  }

  private async validateRelations(
    empresaId: number,
    ids: {
      responsavelId?: number | null;
      leadId?: number | null;
      clienteId?: number | null;
      propertyId?: number | null;
    },
  ) {
    if (ids.responsavelId != null) {
      const user = await this.prisma.usuario.findFirst({
        where: { id: ids.responsavelId, empresaId, ativo: true },
        select: { id: true },
      });
      if (!user) {
        throw new BadRequestException(
          'Relacionamento inválido para esta empresa',
        );
      }
    }

    if (ids.leadId != null) {
      const lead = await this.prisma.lead.findFirst({
        where: { id: ids.leadId, empresaId, ativo: true },
        select: { id: true },
      });
      if (!lead) {
        throw new BadRequestException(
          'Relacionamento inválido para esta empresa',
        );
      }
    }

    if (ids.clienteId != null) {
      const cliente = await this.prisma.cliente.findFirst({
        where: { id: ids.clienteId, empresaId, ativo: true },
        select: { id: true },
      });
      if (!cliente) {
        throw new BadRequestException(
          'Relacionamento inválido para esta empresa',
        );
      }
    }

    if (ids.propertyId != null) {
      const property = await this.prisma.property.findFirst({
        where: { id: ids.propertyId, empresaId, ativo: true },
        select: { id: true },
      });
      if (!property) {
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

  private parseOptionalDate(value?: string | null): Date | null {
    if (value == null || value === '') return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Prazo da tarefa é inválido');
    }
    return date;
  }
}
