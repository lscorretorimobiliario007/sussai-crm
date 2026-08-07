import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  StatusEventoAgenda,
  StatusVisitaCliente,
  TipoEventoAgenda,
  UserProfile,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { QueryEventoDto } from './dto/query-evento.dto';
import { ReagendarEventoDto } from './dto/reagendar-evento.dto';

const eventInclude = {
  usuario: { select: { id: true, nome: true, email: true } },
  createdBy: { select: { id: true, nome: true } },
  cliente: { select: { id: true, nome: true, telefone: true } },
  property: {
    select: {
      id: true,
      codigo: true,
      titulo: true,
      cidade: true,
      bairro: true,
    },
  },
  lead: { select: { id: true, nome: true, status: true } },
} satisfies Prisma.EventoAgendaInclude;

type EventoWithRelations = Prisma.EventoAgendaGetPayload<{
  include: typeof eventInclude;
}>;

const LEMBRETES = [0, 5, 10, 15, 30, 60, 120, 1440];
const MAX_OCORRENCIAS = 52;

@Injectable()
export class AgendaService {
  constructor(private readonly prisma: PrismaService) {}

  async options(user: AuthUser) {
    const ownershipCliente =
      user.perfil === UserProfile.CORRETOR ? { corretorId: user.id } : {};

    const [corretores, clientes, imoveis, leads] = await Promise.all([
      this.prisma.usuario.findMany({
        where: {
          empresaId: user.empresaId,
          ativo: true,
          ...(user.perfil === UserProfile.CORRETOR ? { id: user.id } : {}),
        },
        select: { id: true, nome: true, perfil: true },
        orderBy: { nome: 'asc' },
      }),
      this.prisma.cliente.findMany({
        where: {
          empresaId: user.empresaId,
          ativo: true,
          ...ownershipCliente,
        },
        select: { id: true, nome: true },
        orderBy: { nome: 'asc' },
        take: 200,
      }),
      this.prisma.property.findMany({
        where: { empresaId: user.empresaId, ativo: true },
        select: { id: true, codigo: true, titulo: true },
        orderBy: { titulo: 'asc' },
        take: 200,
      }),
      this.prisma.lead.findMany({
        where: {
          empresaId: user.empresaId,
          ativo: true,
          ...(user.perfil === UserProfile.CORRETOR
            ? { assignedUserId: user.id }
            : {}),
        },
        select: { id: true, nome: true, status: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    return {
      corretores: corretores.map((item) => ({
        id: item.id,
        nome: item.nome,
        tipo: item.perfil,
      })),
      clientes,
      imoveis,
      leads: leads.map((item) => ({
        id: item.id,
        titulo: item.nome,
        status: item.status,
      })),
      tipos: Object.values(TipoEventoAgenda),
      status: Object.values(StatusEventoAgenda),
      repeticoes: ['NENHUMA', 'DIARIA', 'SEMANAL', 'QUINZENAL', 'MENSAL'],
      lembretes: LEMBRETES,
    };
  }

  async dashboard(user: AuthUser) {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const endOfWeek = new Date(startOfDay);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    const scope = { ...this.ownershipWhere(user), ativo: true };

    const [hoje, semana, agendados, concluidos, cancelados, porTipo, proximos] =
      await Promise.all([
        this.prisma.eventoAgenda.count({
          where: {
            ...scope,
            status: {
              in: [StatusEventoAgenda.AGENDADO, StatusEventoAgenda.CONFIRMADO],
            },
            inicio: { gte: startOfDay, lte: endOfDay },
          },
        }),
        this.prisma.eventoAgenda.count({
          where: {
            ...scope,
            status: {
              in: [StatusEventoAgenda.AGENDADO, StatusEventoAgenda.CONFIRMADO],
            },
            inicio: { gte: startOfDay, lte: endOfWeek },
          },
        }),
        this.prisma.eventoAgenda.count({
          where: {
            ...scope,
            status: {
              in: [StatusEventoAgenda.AGENDADO, StatusEventoAgenda.CONFIRMADO],
            },
          },
        }),
        this.prisma.eventoAgenda.count({
          where: { ...scope, status: StatusEventoAgenda.CONCLUIDO },
        }),
        this.prisma.eventoAgenda.count({
          where: { ...scope, status: StatusEventoAgenda.CANCELADO },
        }),
        this.prisma.eventoAgenda.groupBy({
          by: ['tipo'],
          where: {
            ...scope,
            status: {
              in: [StatusEventoAgenda.AGENDADO, StatusEventoAgenda.CONFIRMADO],
            },
          },
          _count: { _all: true },
        }),
        this.prisma.eventoAgenda.findMany({
          where: {
            ...scope,
            status: {
              in: [StatusEventoAgenda.AGENDADO, StatusEventoAgenda.CONFIRMADO],
            },
            inicio: { gte: now },
          },
          include: eventInclude,
          orderBy: { inicio: 'asc' },
          take: 8,
        }),
      ]);

    return {
      resumo: {
        hoje,
        semana,
        agendados,
        concluidos,
        cancelados,
        porTipo: Object.fromEntries(
          porTipo.map((item) => [item.tipo, item._count._all]),
        ),
      },
      proximos: proximos.map((item) => this.mapEvento(item)),
    };
  }

  async timeline(user: AuthUser, page = 1, limit = 20) {
    const where = { ...this.ownershipWhere(user), ativo: true };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.eventoAgenda.findMany({
        where,
        include: {
          usuario: { select: { id: true, nome: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.eventoAgenda.count({ where }),
    ]);

    const data = rows.map((evento) => ({
      id: evento.id,
      acao: this.statusToAcao(evento.status),
      createdAt: evento.updatedAt,
      usuario: evento.usuario,
      evento: {
        id: evento.id,
        titulo: evento.titulo,
        tipo: evento.tipo,
        dataInicio: evento.inicio,
      },
    }));

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async notificacoes(user: AuthUser) {
    const where = {
      empresaId: user.empresaId,
      usuarioId: user.id,
    };
    const [data, naoLidas] = await this.prisma.$transaction([
      this.prisma.agendaNotificacao.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.agendaNotificacao.count({
        where: { ...where, lida: false },
      }),
    ]);
    return { data, meta: { naoLidas } };
  }

  async markAllNotificationsRead(user: AuthUser) {
    await this.prisma.agendaNotificacao.updateMany({
      where: {
        empresaId: user.empresaId,
        usuarioId: user.id,
        lida: false,
      },
      data: { lida: true },
    });
    return { mensagem: 'Notificações marcadas como lidas' };
  }

  async markNotificationRead(user: AuthUser, id: number) {
    const notification = await this.prisma.agendaNotificacao.findFirst({
      where: {
        id,
        empresaId: user.empresaId,
        usuarioId: user.id,
      },
    });
    if (!notification) {
      throw new NotFoundException('Notificação não encontrada');
    }
    return this.prisma.agendaNotificacao.update({
      where: { id },
      data: { lida: true },
    });
  }

  async findAll(user: AuthUser, query: QueryEventoDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 100;
    this.assertCorretorFilter(user, query.usuarioId);

    const propertyId = query.propertyId ?? query.imovelId;
    const inicio = query.inicio ? new Date(query.inicio) : undefined;
    const fim = query.fim ? new Date(query.fim) : undefined;
    if (
      (query.inicio && Number.isNaN(inicio?.getTime())) ||
      (query.fim && Number.isNaN(fim?.getTime()))
    ) {
      throw new BadRequestException('Intervalo de datas inválido');
    }

    const search = query.busca?.trim();
    const where: Prisma.EventoAgendaWhereInput = {
      ...this.ownershipWhere(user),
      ativo: true,
      ...(query.tipo ? { tipo: query.tipo } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(user.perfil !== UserProfile.CORRETOR && query.usuarioId
        ? { usuarioId: query.usuarioId }
        : {}),
      ...(query.clienteId ? { clienteId: query.clienteId } : {}),
      ...(propertyId ? { propertyId } : {}),
      ...(inicio && fim ? { inicio: { gte: inicio, lte: fim } } : {}),
      ...(inicio && !fim ? { inicio: { gte: inicio } } : {}),
      ...(!inicio && fim ? { inicio: { lte: fim } } : {}),
      ...(search
        ? {
            OR: [
              { titulo: { contains: search, mode: 'insensitive' } },
              { descricao: { contains: search, mode: 'insensitive' } },
              { local: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    if (query.modo === 'lista') {
      const [rows, total] = await this.prisma.$transaction([
        this.prisma.eventoAgenda.findMany({
          where,
          include: eventInclude,
          orderBy: { inicio: 'asc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.eventoAgenda.count({ where }),
      ]);
      return {
        data: rows.map((item) => this.mapEvento(item)),
        meta: {
          page,
          limit,
          total,
          totalPages: total === 0 ? 0 : Math.ceil(total / limit),
        },
      };
    }

    const rows = await this.prisma.eventoAgenda.findMany({
      where,
      include: eventInclude,
      orderBy: { inicio: 'asc' },
      take: limit,
    });
    return {
      data: rows.map((item) => this.mapEvento(item)),
      meta: {
        page: 1,
        limit,
        total: rows.length,
        totalPages: 1,
      },
    };
  }

  async findOne(user: AuthUser, id: number) {
    const evento = await this.prisma.eventoAgenda.findFirst({
      where: { id, ...this.ownershipWhere(user), ativo: true },
      include: eventInclude,
    });
    if (!evento) throw new NotFoundException('Compromisso não encontrado');
    return this.mapEvento(evento);
  }

  async create(user: AuthUser, dto: CreateEventoDto) {
    const payload = await this.buildEventPayload(user, dto);
    const occurrences = this.buildOccurrences(payload, dto);

    const created = await this.prisma.$transaction(async (tx) => {
      let parent: EventoWithRelations | null = null;
      for (let index = 0; index < occurrences.length; index += 1) {
        const item = occurrences[index];
        const evento = await tx.eventoAgenda.create({
          data: {
            ...item,
            empresaId: user.empresaId,
            createdById: user.id,
          },
          include: eventInclude,
        });
        if (index === 0) parent = evento;
        await this.maybeCreateNotification(
          tx,
          user,
          evento,
          dto.lembreteMinutos,
        );
        await this.syncVisitaCliente(tx, evento, user.id);
      }
      return parent!;
    });

    return this.mapEvento(created);
  }

  async update(user: AuthUser, id: number, dto: UpdateEventoDto) {
    await this.ensureEvento(user, id);
    const payload = await this.buildEventPayload(user, dto, true);
    const updated = await this.prisma.eventoAgenda.update({
      where: { id },
      data: payload,
      include: eventInclude,
    });
    return this.mapEvento(updated);
  }

  async reagendar(user: AuthUser, id: number, dto: ReagendarEventoDto) {
    await this.ensureEvento(user, id);
    const inicioRaw = dto.inicio ?? dto.dataInicio;
    const fimRaw = dto.fim ?? dto.dataFim;
    if (!inicioRaw || !fimRaw) {
      throw new BadRequestException('Informe início e fim');
    }
    const inicio = new Date(inicioRaw);
    const fim = new Date(fimRaw);
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
      throw new BadRequestException('Datas inválidas');
    }
    if (fim < inicio) {
      throw new BadRequestException(
        'A data de fim deve ser igual ou posterior ao início',
      );
    }

    const updated = await this.prisma.eventoAgenda.update({
      where: { id },
      data: { inicio, fim },
      include: eventInclude,
    });
    return this.mapEvento(updated);
  }

  async concluir(user: AuthUser, id: number) {
    await this.ensureEvento(user, id);
    const updated = await this.prisma.eventoAgenda.update({
      where: { id },
      data: { status: StatusEventoAgenda.CONCLUIDO },
      include: eventInclude,
    });
    return this.mapEvento(updated);
  }

  async cancelar(user: AuthUser, id: number) {
    await this.ensureEvento(user, id);
    const updated = await this.prisma.eventoAgenda.update({
      where: { id },
      data: { status: StatusEventoAgenda.CANCELADO },
      include: eventInclude,
    });
    return this.mapEvento(updated);
  }

  async remove(user: AuthUser, id: number) {
    await this.ensureEvento(user, id);
    await this.prisma.eventoAgenda.update({
      where: { id },
      data: { ativo: false, status: StatusEventoAgenda.CANCELADO },
    });
    return { mensagem: 'Compromisso removido com sucesso' };
  }

  private ownershipWhere(user: AuthUser): Prisma.EventoAgendaWhereInput {
    return {
      empresaId: user.empresaId,
      ...(user.perfil === UserProfile.CORRETOR ? { usuarioId: user.id } : {}),
    };
  }

  private assertCorretorFilter(user: AuthUser, usuarioId?: number) {
    if (
      user.perfil === UserProfile.CORRETOR &&
      usuarioId &&
      usuarioId !== user.id
    ) {
      throw new ForbiddenException(
        'Corretores só podem consultar a própria agenda',
      );
    }
  }

  private async ensureEvento(user: AuthUser, id: number) {
    const evento = await this.prisma.eventoAgenda.findFirst({
      where: { id, ...this.ownershipWhere(user), ativo: true },
      select: { id: true },
    });
    if (!evento) throw new NotFoundException('Compromisso não encontrado');
    return evento;
  }

  private async buildEventPayload(
    user: AuthUser,
    dto: CreateEventoDto | UpdateEventoDto,
    partial = false,
  ): Promise<
    | Prisma.EventoAgendaUncheckedCreateInput
    | Prisma.EventoAgendaUncheckedUpdateInput
  > {
    const inicioRaw = dto.inicio ?? dto.dataInicio;
    const fimRaw = dto.fim ?? dto.dataFim;
    const local = dto.local ?? dto.localizacao;
    const propertyId =
      dto.propertyId !== undefined
        ? dto.propertyId
        : dto.imovelId !== undefined
          ? dto.imovelId
          : undefined;

    if (!partial && (!inicioRaw || !fimRaw)) {
      throw new BadRequestException('Informe início e fim do compromisso');
    }

    const inicio = inicioRaw ? new Date(inicioRaw) : undefined;
    const fim = fimRaw ? new Date(fimRaw) : undefined;
    if (inicioRaw && (!inicio || Number.isNaN(inicio.getTime()))) {
      throw new BadRequestException('Data de início inválida');
    }
    if (fimRaw && (!fim || Number.isNaN(fim.getTime()))) {
      throw new BadRequestException('Data de fim inválida');
    }
    if (inicio && fim && fim < inicio) {
      throw new BadRequestException(
        'A data de fim deve ser igual ou posterior ao início',
      );
    }

    if (
      dto.lembreteMinutos != null &&
      !LEMBRETES.includes(dto.lembreteMinutos)
    ) {
      throw new BadRequestException(
        'Lembrete deve ser 0, 5, 10, 15, 30, 60, 120 ou 1440 minutos',
      );
    }

    const usuarioId =
      user.perfil === UserProfile.CORRETOR
        ? user.id
        : (dto.usuarioId ?? (partial ? undefined : user.id));

    if (usuarioId) await this.ensureUsuario(user.empresaId, usuarioId);
    if (dto.clienteId) await this.ensureCliente(user.empresaId, dto.clienteId);
    if (propertyId) await this.ensureProperty(user.empresaId, propertyId);
    if (dto.leadId) await this.ensureLead(user.empresaId, dto.leadId);

    const data: Prisma.EventoAgendaUncheckedCreateInput = {
      empresaId: user.empresaId,
      createdById: user.id,
      titulo: dto.titulo?.trim() ?? '',
      tipo: dto.tipo ?? TipoEventoAgenda.VISITA,
      status: dto.status ?? StatusEventoAgenda.AGENDADO,
      inicio: inicio ?? new Date(),
      fim: fim ?? new Date(),
      diaInteiro: dto.diaInteiro ?? false,
      local: this.normalizeOptionalText(local),
      descricao: this.normalizeOptionalText(dto.descricao),
      usuarioId: usuarioId ?? null,
      clienteId: dto.clienteId ?? null,
      propertyId: propertyId ?? null,
      leadId: dto.leadId ?? null,
    };

    if (partial) {
      const update: Prisma.EventoAgendaUncheckedUpdateInput = {};
      if (dto.titulo !== undefined) update.titulo = dto.titulo.trim();
      if (dto.tipo !== undefined) update.tipo = dto.tipo;
      if (dto.status !== undefined) update.status = dto.status;
      if (inicio) update.inicio = inicio;
      if (fim) update.fim = fim;
      if (dto.diaInteiro !== undefined) update.diaInteiro = dto.diaInteiro;
      if (local !== undefined) update.local = this.normalizeOptionalText(local);
      if (dto.descricao !== undefined) {
        update.descricao = this.normalizeOptionalText(dto.descricao);
      }
      if (usuarioId !== undefined) update.usuarioId = usuarioId;
      if (dto.clienteId !== undefined) update.clienteId = dto.clienteId;
      if (propertyId !== undefined) update.propertyId = propertyId;
      if (dto.leadId !== undefined) update.leadId = dto.leadId;
      return update;
    }

    if (!data.titulo) throw new BadRequestException('Título é obrigatório');
    return data;
  }

  private buildOccurrences(
    base:
      | Prisma.EventoAgendaUncheckedCreateInput
      | Prisma.EventoAgendaUncheckedUpdateInput,
    dto: CreateEventoDto,
  ): Prisma.EventoAgendaUncheckedCreateInput[] {
    const createBase = base as Prisma.EventoAgendaUncheckedCreateInput;
    const repeticao = dto.repeticao || 'NENHUMA';
    if (repeticao === 'NENHUMA') return [createBase];

    const occurrences: Prisma.EventoAgendaUncheckedCreateInput[] = [];
    const duration =
      new Date(createBase.fim).getTime() -
      new Date(createBase.inicio).getTime();
    let cursorStart = new Date(createBase.inicio);
    let cursorEnd = new Date(createBase.fim);
    const hardLimit = dto.repeticaoAte
      ? new Date(dto.repeticaoAte)
      : (() => {
          const date = new Date(createBase.inicio);
          date.setMonth(date.getMonth() + 6);
          return date;
        })();

    for (let i = 0; i < MAX_OCORRENCIAS; i += 1) {
      if (cursorStart > hardLimit) break;
      occurrences.push({
        ...createBase,
        inicio: new Date(cursorStart),
        fim: new Date(cursorEnd),
      });
      cursorStart = this.addRecurrence(cursorStart, repeticao);
      cursorEnd = new Date(cursorStart.getTime() + duration);
    }

    return occurrences.length ? occurrences : [createBase];
  }

  private addRecurrence(date: Date, frequencia: string) {
    const next = new Date(date);
    if (frequencia === 'DIARIA') next.setDate(next.getDate() + 1);
    else if (frequencia === 'SEMANAL') next.setDate(next.getDate() + 7);
    else if (frequencia === 'QUINZENAL') next.setDate(next.getDate() + 14);
    else if (frequencia === 'MENSAL') next.setMonth(next.getMonth() + 1);
    return next;
  }

  private async maybeCreateNotification(
    tx: Prisma.TransactionClient,
    user: AuthUser,
    evento: EventoWithRelations,
    lembreteMinutos?: number | null,
  ) {
    if (lembreteMinutos == null || !evento.usuarioId) return;
    await tx.agendaNotificacao.create({
      data: {
        empresaId: user.empresaId,
        usuarioId: evento.usuarioId,
        eventoId: evento.id,
        titulo: `Lembrete: ${evento.titulo}`,
        mensagem: `Compromisso "${evento.titulo}" em ${lembreteMinutos} minuto(s).`,
      },
    });
  }

  private async syncVisitaCliente(
    tx: Prisma.TransactionClient,
    evento: EventoWithRelations,
    usuarioId: number,
  ) {
    if (
      evento.tipo !== TipoEventoAgenda.VISITA ||
      !evento.clienteId ||
      !evento.propertyId
    ) {
      return;
    }
    await tx.clienteVisita.create({
      data: {
        empresaId: evento.empresaId,
        clienteId: evento.clienteId,
        propertyId: evento.propertyId,
        usuarioId,
        dataHora: evento.inicio,
        status:
          evento.status === StatusEventoAgenda.CONCLUIDO
            ? StatusVisitaCliente.REALIZADA
            : evento.status === StatusEventoAgenda.CANCELADO
              ? StatusVisitaCliente.CANCELADA
              : StatusVisitaCliente.AGENDADA,
        observacoes: evento.descricao || `Agenda: ${evento.titulo}`,
      },
    });
  }

  private async ensureUsuario(empresaId: number, id: number) {
    const row = await this.prisma.usuario.findFirst({
      where: { id, empresaId, ativo: true },
      select: { id: true },
    });
    if (!row) throw new BadRequestException('Corretor inválido');
  }

  private async ensureCliente(empresaId: number, id: number) {
    const row = await this.prisma.cliente.findFirst({
      where: { id, empresaId, ativo: true },
      select: { id: true },
    });
    if (!row) throw new BadRequestException('Cliente inválido');
  }

  private async ensureProperty(empresaId: number, id: number) {
    const row = await this.prisma.property.findFirst({
      where: { id, empresaId, ativo: true },
      select: { id: true },
    });
    if (!row) throw new BadRequestException('Imóvel inválido');
  }

  private async ensureLead(empresaId: number, id: number) {
    const row = await this.prisma.lead.findFirst({
      where: { id, empresaId, ativo: true },
      select: { id: true },
    });
    if (!row) throw new BadRequestException('Lead inválido');
  }

  private mapEvento(evento: EventoWithRelations) {
    const { property, createdBy, lead, ...rest } = evento;
    return {
      ...rest,
      dataInicio: evento.inicio,
      dataFim: evento.fim,
      localizacao: evento.local,
      imovelId: evento.propertyId,
      imovel: property,
      criadoPor: createdBy,
      lembreteMinutos: null,
      lead: lead
        ? { id: lead.id, titulo: lead.nome, status: lead.status }
        : null,
    };
  }

  private statusToAcao(status: StatusEventoAgenda) {
    if (status === StatusEventoAgenda.CONCLUIDO) return 'CONCLUIDO';
    if (status === StatusEventoAgenda.CANCELADO) return 'CANCELADO';
    if (status === StatusEventoAgenda.CONFIRMADO) return 'CONFIRMADO';
    return 'ATUALIZADO';
  }

  private normalizeOptionalText(value?: string | null) {
    if (value == null) return null;
    const trimmed = String(value).trim();
    return trimmed || null;
  }
}
